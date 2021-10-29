
 
import { JsonRpcProvider } from '@ethersproject/providers';
import { suggestFees, suggestMaxBaseFee, suggestMaxPriorityFee } from 'eip1559-fee-suggestions-ethers';
import {MongoClient} from 'mongodb'
import fs from 'fs';
import {ema} from 'moving-averages'

const toGwei = wei => {
    return wei * Math.pow(10, -9)
}

const  linearRegression = (y,x) => {
    let n = y.length;
    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_xx = 0;
    let sum_yy = 0;

    for (let i = 0; i < y.length; i++) {
        const cY = Number(y[i])
        const cX = Number(x[i])
        sum_x += cX;
        sum_y += cY;
        sum_xy += (cX*cY);
        sum_xx += (cX*cX);
        sum_yy += (cY*cY);
    } 
    const slope = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);

    return slope;
}


const provider = new JsonRpcProvider(``);

const median = (values) => {
    if(values.length ===0) return -1;
  
    values.sort(function(a,b){
      return a-b;
    });
  
    var half = Math.floor(values.length / 2);
    
    if (values.length % 2)
      return values[half];
    
    return (values[half - 1] + values[half]) / 2.0;
  }

const getMaxPriorityFeeMaxAndMin = async (blockInfo) => {
    const txHashes = blockInfo.transactions
    let minPriorityFee = null
    let maxPriorityFee = null
    const priortyFees = []
    let minHash = ''

    const promises = txHashes.map(async hash => {
        try {
            const tx = await provider.send("eth_getTransactionByHash",[hash])
            const maxPriorityFeePerGas = tx?.maxPriorityFeePerGas || null
            if (!maxPriorityFeePerGas) return
            const priorityFeeNumber = Number(maxPriorityFeePerGas)
            priortyFees.push(priorityFeeNumber)
            if (!minPriorityFee || priorityFeeNumber < minPriorityFee) {
                minPriorityFee = priorityFeeNumber
                minHash = hash
            }
            if (!maxPriorityFee || priorityFeeNumber > maxPriorityFee) {
            maxPriorityFee = priorityFeeNumber
            }
        } catch (e) {
            //
        }

    })
    await Promise.all(promises)
    const medianPriorityFee = toGwei(median(priortyFees))
    return { minPriorityFee: toGwei(minPriorityFee), maxPriorityFee: toGwei(maxPriorityFee), medianPriorityFee }

}
const hundredBlocksArray = Array.from(Array(100).keys())

let blockNativeMaxPriorityFee = {}

let currentBlockSuggestions = {}

const getBlockSuggestions = async (blockNumber) => {
    // const suggestedFees = await suggestMaxBaseFee(provider, blockNumber);
    console.log('getBlockSuggestions', blockNumber)
    const blockInfo = await provider.send("eth_getBlockByNumber", [blockNumber, false])
    const blockPriorityFee = await getMaxPriorityFeeMaxAndMin(blockInfo)
    // const smgf = suggestedFees.suggestions.map(({maxFeePerGas}) => maxFeePerGas)
    const obj = {
        block: {
            priorityFee: blockPriorityFee,
            blockBaseFee: toGwei(Number(blockInfo.baseFeePerGas)),
        },
        blockNumber: Number(blockNumber)
        
    }
    return obj
}

const loadData = async (blockNumber) => {
    try {
        // get prev block info
        const prevBlockHexNumber = '0x' + Number(blockNumber-1).toString(16)
        const blockInfo = await provider.send("eth_getBlockByNumber",[prevBlockHexNumber, false])
        const baseFeePerGas = blockInfo.baseFeePerGas
        const { minPriorityFee, maxPriorityFee, medianPriorityFee } = await getMaxPriorityFeeMaxAndMin(blockInfo)
        const prevBlockInfo = {
            baseFeePerGas: toGwei(baseFeePerGas),
            minPriorityFeePerGas: minPriorityFee,
            maxPriorityFeePerGas: maxPriorityFee,
            medianPriorityFeePerGas: medianPriorityFee,
        }
        const suggestedFees = await suggestFees(provider);
        const {baseFeePerGas: baseFeePerGasHistory} = await provider.send("eth_feeHistory", [99, "latest", []])
        const smgf = suggestedFees.map(({maxFeePerGas}) => maxFeePerGas)
        const smpf = suggestedFees.map(({maxPriorityFeePerGas}) => maxPriorityFeePerGas)
        const maxSuggestedBaseFee = Math.max(...smgf)
        const minSuggestedBaseFee = Math.min(...smgf)
        const medianSuggestedBaseFee = median(smgf)
        
        const sum = smgf.reduce((a, b) => a + b, 0);
        const avgSuggestedBaseFee = (sum / smgf.length) || 0;
    
        const maxSuggestedMaxPriorityFee = Math.max(...smpf)
        const minSuggestedMaxPriorityFee = Math.min(...smpf)
        const medianSuggestedMaxPriorityFee = median(smpf)
        const sumsmpf = smpf.reduce((a, b) => a + b, 0);
        const avgSuggestedMaxPriorityFee = (sumsmpf / smpf.length) || 0;
        const baseFeePerGasHistoryNumbers = baseFeePerGasHistory.map(h => toGwei(Number(h)))
        const trend = linearRegression(baseFeePerGasHistoryNumbers, hundredBlocksArray)
        const obj = {
            suggestedMaxBaseFee: {
                max: toGwei(maxSuggestedBaseFee),
                min: toGwei(minSuggestedBaseFee),
                avg: toGwei(avgSuggestedBaseFee),
                median: toGwei(medianSuggestedBaseFee)
            },
            suggestedMaxPriorityFee: {
                max: toGwei(maxSuggestedMaxPriorityFee),
                min: toGwei(minSuggestedMaxPriorityFee),
                avg: toGwei(avgSuggestedMaxPriorityFee),
                median: toGwei(medianSuggestedMaxPriorityFee)
            },
            blockNativeMaxPriorityFee: blockNativeMaxPriorityFee,
            trend
        }
        currentBlockSuggestions[blockNumber] = obj
        const originalEstimations = currentBlockSuggestions[blockNumber-1] 
        // remove saved estimations
        Object.keys(currentBlockSuggestions).filter(n => n < blockNumber-1).forEach(blockNumber => {
            delete currentBlockSuggestions[blockNumber]
        })

        if (!originalEstimations) return null
        const finalObj = {
            block: prevBlockInfo,
            blocknumber: Number(blockNumber-1), 
            ...originalEstimations
        }
        return finalObj
    } catch (e) {
        console.log(e)
        return null
    }
}

const onNewBlock = async (callback) => {
    const fetching = true
    let lastBlockNumber = 0
    while (fetching) {
        const blockNumberHex = await provider.send("eth_blockNumber")
        const blockNumber = Number(blockNumberHex)
        if (blockNumber > lastBlockNumber) {
            lastBlockNumber = blockNumber
            try {
                callback(blockNumber)
            } catch (e) {
                console.log('onNewBlock error', e)
            }
        }
        await new Promise(res=> setTimeout(() => res(), 2000))
    }
}

var url = "mongodb://localhost:27017/";

// get block data as min priority fee
const main = async (collectionName) => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("mydb")

    let numberOfErrors = 0

    const yeah = async (blockNumber) => {
        try {
            const obj = await getBlockSuggestions(blockNumber)
            if (obj) {
                db.collection(`${collectionName}`).insertOne(obj, function(err, res) {
                    if (err) throw err;
                    console.log(`errors: `, numberOfErrors);
                })
            } else {
                numberOfErrors += 1
            }
        } catch(e) {
            numberOfErrors += 1
            console.log('e', e)
        }
    }

    
    const failedBlocks = []
    // const blockChunks = [13410000, 13421025]
    const blockChunks = [13429500, 13433025, 13440000, 13445000, 13452000, 13460000]
    for (let m = 0; m < blockChunks.length; m++) {
        const fromBlock = blockChunks[m]
        let i = 0
        while (i < 2001) {
            try {
                const hexBlockNymber = '0x' + Number(fromBlock+i).toString(16)
                await yeah(hexBlockNymber)
            } catch (e) {
                console.log('failed block: ', blocks[i])
                failedBlocks.push(blocks[i])
            }
            i += 1
        }
    }

}

const getAllRewards = async (collectionName) => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("consolidated")

    // const blocks = [10762137]
    const blocks = [13404034, 13404035, 13404036]

    const maxBlock = Math.max(...blocks)
    let rounds = Math.ceil(blocks.length/1024)
    console.log('rounds', rounds)
    const numberOfBlocks = blocks.length
    let initBlockNumber = maxBlock
    const cursor = await db.collection('complete-grouped-blocks-data').find()
    const cursorSorted = await cursor.sort({blockNumber: -1})
    // for (let l = 0; l < rounds; l++) {
        initBlockNumber = initBlockNumber - 0*numberOfBlocks
        const initBlockNumberHex = '0x' + Number(initBlockNumber).toString(16)
        const feeHistory = await provider.send("eth_feeHistory", [numberOfBlocks, initBlockNumberHex, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]])
        const rewards = feeHistory.reward
        const baseFeePerGas = feeHistory.baseFeePerGas
        const gasUsedRatio = feeHistory.gasUsedRatio
        const oldestBlock = Number(feeHistory.oldestBlock)
        for (let i = 0; i < numberOfBlocks; i++) {
            const currentBlock = oldestBlock+i
            const reward = rewards[i]
            const rewardsPerc = {
                perc5: toGwei(Number(reward[0])),
                perc10: toGwei(Number(reward[1])),
                perc15: toGwei(Number(reward[2])),
                perc20: toGwei(Number(reward[3])),
                perc25: toGwei(Number(reward[4])),
                perc30: toGwei(Number(reward[5])),
                perc35: toGwei(Number(reward[6])),
                perc40: toGwei(Number(reward[7])),
                perc45: toGwei(Number(reward[8])),
                perc50: toGwei(Number(reward[9])),
            }
            const gasUsedRatioBlock = gasUsedRatio[i]
            const baseFeePerGasBlock = toGwei(baseFeePerGas[i])
            console.log('currentBlock', currentBlock )
            console.log('currentBlock perc5', rewardsPerc.perc5 )
            console.log('currentBlock perc10', rewardsPerc.perc10 )
            console.log('currentBlock perc45', rewardsPerc.perc45 )
            console.log('gasUsedRatioBlock', gasUsedRatioBlock )
            console.log('baseFeePerGasBlock', baseFeePerGasBlock )
            const obj = {
                blockNumber: currentBlock,
                rewards: rewardsPerc,
                gasUsedRatio: gasUsedRatioBlock,
                baseFeePerGas: baseFeePerGasBlock
            }
            // console.log('obj', obj)
            // try {
            //     // const obj = await getBlockSuggestions(blockNumber)
            //     if (obj) {
            //         db.collection(`${collectionName}_withperc`).insertOne(obj, function(err, res) {
            //             if (err) throw err;
            //         })

            //         // blockNativeDataWithBlock
            //     } else {
            //         numberOfErrors += 1
            //     }
            // } catch(e) {
            //     console.log('e', e)
            // }
        }
    // }

}

getAllRewards()

const suggest = (
    values,
    timeFactor,
    sampleMin,
    sampleMax
  ) => {
    const order = Array.from(Array(values.length).keys())

    if (timeFactor < 1e-6) {
      return baseFee[values.length - 1];
    }
    const pendingWeight =
      (1 - Math.exp(-1 / timeFactor)) /
      (1 - Math.exp(-values.length / timeFactor));
    let sumWeight = 0;
    let result = 0;
    let samplingCurveLast = 0;
    for (let i = 0; i < order.length; i++) {
      sumWeight +=
        pendingWeight * Math.exp((order[i] - values.length + 1) / timeFactor);
      const samplingCurveValue = samplingCurve(sumWeight, sampleMin, sampleMax);
      result += (samplingCurveValue - samplingCurveLast) * values[order[i]];
      if (samplingCurveValue >= 1) {
        return result;
      }
      samplingCurveLast = samplingCurveValue;
    }
    return result;
  };
  
  // samplingCurve is a helper function for the base fee percentile range calculation.
  const samplingCurve = (
    sumWeight,
    sampleMin,
    sampleMax
  ) => {
    if (sumWeight <= sampleMin) {
      return 0;
    }
    if (sumWeight >= sampleMax) {
      return 1;
    }
    return (
      (1 -
        Math.cos(
          ((sumWeight - sampleMin) * 2 * Math.PI) / (sampleMax - sampleMin)
        )) /
      2
    );
  };

const calculateEma = async (db, collectionName) => {
    const values = {}
    let notfound = 0
    const jsonString = await fs.readFileSync(`${collectionName}_blocknative.json`, 'utf8')
    const blocks = JSON.parse(jsonString).map(({blockNumber}) => Number(blockNumber))

    for (let i = 0; i < blocks.length; i++) {
        try {
            const block = blocks[i]
            const feeHistoryForBlockCursor =  db.collection(`${collectionName}_withperc`).find({blockNumber: block})
            const feeHistoryForBlock =  feeHistoryForBlockCursor.hasNext() ? await feeHistoryForBlockCursor.next() : null;
            if (!feeHistoryForBlock) {
                console.log('--- block', block)
                notfound+=1
            }
            const newRewards = {
                perc10: feeHistoryForBlock?.rewards.perc10,
                perc25: feeHistoryForBlock?.rewards.perc25,
                perc50: feeHistoryForBlock?.rewards.perc50,
                perc20: feeHistoryForBlock?.rewards.perc20,
                perc30: feeHistoryForBlock?.rewards.perc30,
                perc40: feeHistoryForBlock?.rewards.perc40,
            }
        
            values[block] = {
                perc10: newRewards.perc10,
                perc20: newRewards.perc20,
                perc25: newRewards.perc25,
                perc30: newRewards.perc30,
                perc40: newRewards.perc40,
                perc50: newRewards.perc50,
            }
            
        } catch(e) {
            console.log('e', e)
        }
    }
    console.log('notfoundnotfound', notfound)

    const perc10Values = Object.values(values).map(({perc10})=> perc10)
    const perc20Values = Object.values(values).map(({perc20})=> perc20)
    const perc25Values = Object.values(values).map(({perc25})=> perc25)
    const perc30Values = Object.values(values).map(({perc30})=> perc30)
    const perc40Values = Object.values(values).map(({perc40})=> perc40)
    const perc50Values = Object.values(values).map(({perc50})=> perc50)

    const data = {}


    const emaPerc10n100 = ema(perc10Values, 100)
    const emaPerc10n20 = ema(perc10Values, 20)
    const emaPerc10n10 = ema(perc10Values, 10)
    const emaPerc10n5 = ema(perc10Values, 5)

    const emaPerc20n100 = ema(perc20Values, 100)
    const emaPerc20n20 = ema(perc20Values, 20)
    const emaPerc20n10 = ema(perc20Values, 10)
    const emaPerc20n5 = ema(perc20Values, 5)

    const emaPerc25n100 = ema(perc25Values, 100)
    const emaPerc25n20 = ema(perc25Values, 20)
    const emaPerc25n10 = ema(perc25Values, 10)
    const emaPerc25n5 = ema(perc25Values, 5)

    const emaPerc30n100 = ema(perc30Values, 100)
    const emaPerc30n20 = ema(perc30Values, 20)
    const emaPerc30n10 = ema(perc30Values, 10)
    const emaPerc30n5 = ema(perc30Values, 5)

    const emaPerc40n100 = ema(perc40Values, 100)
    const emaPerc40n20 = ema(perc40Values, 20)
    const emaPerc40n10 = ema(perc40Values, 10)
    const emaPerc40n5 = ema(perc40Values, 5)
    
    const emaPerc50n100 = ema(perc50Values, 100)
    const emaPerc50n20 = ema(perc50Values, 20)
    const emaPerc50n10 = ema(perc50Values, 10)
    const emaPerc50n5 = ema(perc50Values, 5)


    Object.keys(values).forEach((blockNumber, i) => {
        const start100 = i-100 > 0 ? i-100 : 0
        const start20 = i-20 > 0 ? i-20 : 0
        const perc10ToAnalize100 = perc10Values.slice(start100,i)
        const perc10LinearRegression100 = linearRegression(perc10ToAnalize100, perc10ToAnalize100.length) 
        const perc10ToAnalize20 = perc10Values.slice(start20,i)
        const perc10LinearRegression20 = linearRegression(perc10ToAnalize20, perc10ToAnalize20.length) 
        const perc10Median100 = median(perc10ToAnalize100)
        const perc10Median20 = median(perc10ToAnalize20)

        const perc25ToAnalize100 = perc25Values.slice(start100,i)
        const perc25LinearRegression100 = linearRegression(perc25ToAnalize100, perc25ToAnalize100.length) 
        const perc25ToAnalize20 = perc25Values.slice(start20,i)
        const perc25LinearRegression20 = linearRegression(perc25ToAnalize20, perc25ToAnalize20.length) 
        const perc25Median100 = median(perc25ToAnalize100)
        const perc25Median20 = median(perc25ToAnalize20)
       
        const perc50ToAnalize100 = perc50Values.slice(start100,i)
        const perc50LinearRegression100 = linearRegression(perc50ToAnalize100, perc50ToAnalize100.length) 
        const perc50ToAnalize20 = perc50Values.slice(start20,i)
        const perc50LinearRegression20 = linearRegression(perc50ToAnalize20, perc50ToAnalize20.length) 
        const perc50Median100 = median(perc50ToAnalize100)
        const perc50Median20 = median(perc50ToAnalize20)

        data[blockNumber] = {
            linearRegression: {
                n100: {
                    perc10: perc10LinearRegression100,
                    perc25: perc25LinearRegression100,
                    perc50: perc50LinearRegression100
                },
                n20: {
                    perc10: perc10LinearRegression20,
                    perc25: perc25LinearRegression20,
                    perc50: perc50LinearRegression20
                }
            },
            ema: {
                n100: {
                    perc10: emaPerc10n100[i],
                    perc20: emaPerc20n100[i],
                    perc25: emaPerc25n100[i],
                    perc30: emaPerc30n100[i],
                    perc40: emaPerc40n100[i],
                    perc50: emaPerc50n100[i]
                },
                n20: {
                    perc10: emaPerc10n20[i],
                    perc20: emaPerc20n20[i],
                    perc25: emaPerc25n20[i],
                    perc30: emaPerc30n20[i],
                    perc40: emaPerc40n20[i],
                    perc50: emaPerc50n20[i]
                },
                n10: {
                    perc10: emaPerc10n10[i],
                    perc20: emaPerc20n10[i],
                    perc25: emaPerc25n10[i],
                    perc30: emaPerc30n10[i],
                    perc40: emaPerc40n10[i],
                    perc50: emaPerc50n10[i]
                },
                n5: {
                    perc10: emaPerc10n5[i],
                    perc20: emaPerc20n5[i],
                    perc25: emaPerc25n5[i],
                    perc30: emaPerc30n5[i],
                    perc40: emaPerc40n5[i],
                    perc50: emaPerc50n5[i]
                }
            },
            median: {
                n100: {
                    perc10: perc10Median100,
                    perc25: perc25Median100,
                    perc50: perc50Median100
                },
                n20: {
                    perc10: perc10Median20,
                    perc25: perc25Median20,
                    perc50: perc50Median20
                },
            }
        }
    })

    return data
}

const mixDatas = async (collectionName) => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("mydb")
    const data = await calculateEma(db, collectionName)
    const jsonString = await fs.readFileSync(`${collectionName}_blocknative.json`, 'utf8')
    const blocks = JSON.parse(jsonString).map(({blockNumber}) => Number(blockNumber))
    for (let i = 0; i < blocks.length; i++) {
        try {
            const block = blocks[i]
            const feeHistoryForBlockCursor =  db.collection(`${collectionName}_withperc`).find({blockNumber: block})
            const feeHistoryForBlock =  feeHistoryForBlockCursor.hasNext() ? await feeHistoryForBlockCursor.next() : null;

            const newRewards = {
                perc10: feeHistoryForBlock.rewards.perc10,
                perc25: feeHistoryForBlock.rewards.perc25,
                perc50: feeHistoryForBlock.rewards.perc50,
                perc20: feeHistoryForBlock.rewards.perc20,
                perc30: feeHistoryForBlock.rewards.perc30,
                perc40: feeHistoryForBlock.rewards.perc40,
            }

            const bnDataForBlockCursor =  db.collection(`${collectionName}_blocknative`).find({blockNumber: block})
            const bnDataForBlock =  bnDataForBlockCursor.hasNext() ? await bnDataForBlockCursor.next() : null;
            // 13469671
            // 13472752
            // 13472557
            const blocksInfoCursor =  db.collection(`${collectionName}`).find({blockNumber: block})
            const blockInfoForBlock =  blocksInfoCursor.hasNext() ? await blocksInfoCursor.next() : null;
            if (feeHistoryForBlock && bnDataForBlock && blockInfoForBlock && data[block]) {
                db.collection(`${collectionName}_full`).insertOne({
                    data: data?.[block],
                    block: {
                        rewards: newRewards,
                        gasUsedRatio: feeHistoryForBlock.gasUsedRatio,
                        baseFeePerGas: feeHistoryForBlock.baseFeePerGas,
                        blockPriorityFee: blockInfoForBlock.blockPriorityFee,
                        trend: blockInfoForBlock.trend,
                        suggestedMaxBaseFee: blockInfoForBlock.suggestedMaxBaseFee,
                    },
                    blocknative: {
                        urgent: bnDataForBlock.urgent,
                        fast: bnDataForBlock.fast,
                        normal: bnDataForBlock.normal,
                        slow: bnDataForBlock.slow,
                        slower: bnDataForBlock.slower,
                    },
                    blockNumber: block
                }, function(err, res) {
                    if (err) throw err;
                })
            }
            } catch(e) {
            // console.log('e', e)
        }
    }
}


const runData = async collectionName => {
    await main(collectionName)
    await mixDatas(collectionName)
}

const a = async () => {
    const suggesttions = await suggestFees(provider)
    console.log('suggetsions', suggesttions)
}

const rename = async () => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("mydb")
    // await  db.collection(`blockNativeAndOnChainWithDataPerc102025304050`).rename('21-10-blocks-full')
    await  db.collection(`21-10-blocks-full-withpackage-2`).rename('21-10-blocks-full-withpackage-ouliers')
    // await  db.collection(`monday_13486948_13489088_blocks_full`).rename('25-10-blocks-full')
    // await  db.collection(`13481256_13483769_blocks_data_sunday_full`).rename('24-10-blocks-full')
    return
}

const runEstimationsPackage = async (fileName) => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("mydb")
    const consolidated = mongoClient.db('consolidated')
    const cursor = await  db.collection(fileName).find()
    let next = await cursor.hasNext()
    let count = 0
    while (next) {
        const value = await cursor.next()
        const currentBlock = '0x' + Number(value.blockNumber).toString(16)
        const maxBaseFeeSuggestions = await suggestMaxBaseFee(provider, currentBlock)
        const priorityFeeSuggestion = await suggestMaxPriorityFee(provider, currentBlock)
        const {_id, ...values} = value
        const newObject = {
            ...values,
            suggestions: {
                maxBaseFee: maxBaseFeeSuggestions,
                maxPriorityFee: priorityFeeSuggestion
            }
        }
        try {
            consolidated.collection(`${fileName}-withpackage-removeoutlier-10`).insertOne(newObject, function(err, res) {
                if (err) throw err;
                console.log('count', count)
                count += 1
            })
        } catch(e) {
            //
        }
        next = await cursor.hasNext() 
    }
}

const estimations = async () => {
    runEstimationsPackage('27-10-13410000-13460000-chunk-blocks')
    // await runEstimationsPackage('22-10-blocks-full')
    // runEstimationsPackage('24-10-blocks-full')
    // await runEstimationsPackage('25-10-blocks-full')
    // runEstimationsPackage('12-10-13403835-13405835-blocks')
    // await runEstimationsPackage('26-10-13493835-13495835-blocks')
}

const combineData = async () => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("consolidated")
    const files = [
        '12-10-13403835-13405835-blocks-withpackage-removeoutlier-10',
        '21-10-blocks-full-withpackage-removeoutlier-10',
        '22-10-blocks-full-withpackage-removeoutlier-10',
        '24-10-blocks-full-withpackage-removeoutlier-10',
        '25-10-blocks-full-withpackage-removeoutlier-10',
        '26-10-13493835-13495835-blocks-withpackage-removeoutlier-10',
        '27-10-13410000-13460000-chunk-blocks'
        
    ]
    for (let i = 0; i < files.length; i++) {
        const cursor = await  db.collection(files[i]).find()
        let next = await cursor.hasNext()
        let count = 0
        while (next) {
            const value = await cursor.next()
            const {_id, suggestions, ...values} = value
            const newObject = { ...values }
            try {
                db.collection(`complete-grouped-blocks-data`).insertOne(newObject, function(err, res) {
                    if (err) throw err;
                    console.log('count', count)
                    count += 1
                })
            } catch(e) {
                //
            }
            next = await cursor.hasNext() 
        }
    }
} 

const formatDataa = async () => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("mydb")
    const consolidateddb = mongoClient.db("consolidated")
    const files = [
        // '12-10-13403835-13405835-blocks-withpackage-removeoutlier-10',
        // '21-10-blocks-full-withpackage-removeoutlier-10',
        // '22-10-blocks-full-withpackage-removeoutlier-10',
        // '24-10-blocks-full-withpackage-removeoutlier-10',
        // '25-10-blocks-full-withpackage-removeoutlier-10',
        // '26-10-13493835-13495835-blocks-withpackage-removeoutlier-10',
        '27-10-13410000-13460000-chunk-blocks'
        
    ]
    for (let i = 0; i < files.length; i++) {
        const cursor = await  db.collection(files[i]).find()
        let next = await cursor.hasNext()
        let count = 0
        while (next) {
            const value = await cursor.next()
            const {_id, ...values} = value
            const newObject = { 
                block: {
                    baseFeePerGas: values.block.blockBaseFee,
                    priorityFee: values.block.priorityFee
                },
                blockNumber: values.blockNumber
             }
            try {
                consolidateddb.collection(`${files[i]}`).insertOne(newObject, function(err, res) {
                    if (err) throw err;
                    console.log('count', count)
                    count += 1
                })
            } catch(e) {
                //
            }
            next = await cursor.hasNext() 
        }
    }
} 

// main('27-10-13410000-13460000-chunk-blocks')