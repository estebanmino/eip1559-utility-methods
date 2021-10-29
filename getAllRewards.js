import fs from 'fs';
import { JsonRpcProvider } from '@ethersproject/providers';
import {MongoClient} from 'mongodb'
import BigNumber from 'bignumber.js';


const url = "mongodb://localhost:27017/";
const provider = new JsonRpcProvider(``);

export const divide = (
    numberOne,
    numberTwo
  )  => {
    if (!(numberOne || numberTwo)) return new BigNumber(0);
    return new BigNumber(numberOne).dividedBy(numberTwo);
  };
  

export const weiToGwei = (weiAmount) => {
    const gweiAmount = divide(weiAmount, 1000000000).toNumber();
    return gweiAmount;
  };

const getAllRewards = async () => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("consolidated")
    let count = 0
    const blocks = [
        13406000,
        13412000,
        13423000,
        13432000,
        13435000,
        13442000,
        13447000,
        13454000,
        13462000,
        13467000,
        13473000,
        13483000,
        13490000,
        13496000
    ]

    for (let l = 0; l < blocks.length; l++) {
        const initBlockNumber = blocks[l]
        for (let round = 0; round < 4; round++) {
            const roundBlockNumber = initBlockNumber-round*1024
            const initBlockNumberHex = '0x' + Number(roundBlockNumber).toString(16)
            const feeHistory = await provider.send("eth_feeHistory", [1024, initBlockNumberHex, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]])
            const rewards = feeHistory.reward
            // const baseFeePerGas = feeHistory.baseFeePerGas
            const gasUsedRatio = feeHistory.gasUsedRatio
            const oldestBlock = Number(feeHistory.oldestBlock)


            for (let i = 0; i < 1024; i++) {
                const currentBlock = oldestBlock+i
                const currentBlockData = await db.collection('complete-grouped-blocks-data').find({blockNumber: currentBlock})
                const blockExists = await currentBlockData.hasNext()
                if (blockExists) {
                    const blockData = await currentBlockData.next()

                    const reward = rewards[i]
                    const rewardsPerc = {
                        perc5: weiToGwei(reward[0]),
                        perc10: weiToGwei(reward[1]),
                        perc15: weiToGwei(reward[2]),
                        perc20: weiToGwei(reward[3]),
                        perc25: weiToGwei(reward[4]),
                        perc30: weiToGwei(reward[5]),
                        perc35: weiToGwei(reward[6]),
                        perc40: weiToGwei(reward[7]),
                        perc45: weiToGwei(reward[8]),
                        perc50: weiToGwei(reward[9]),
                    }
                    const gasUsedRatioBlock = gasUsedRatio[i]
                    // const baseFeePerGasBlock = weiToGwei(baseFeePerGas[i])
                    // console.log('-----------')
                    // console.log('currentBlock', currentBlock )
                    // console.log('-- blockNumber', blockData.blockNumber )
                    // console.log('baseFeePerGasBlock', baseFeePerGasBlock )
                    // console.log('-- block.baseFeePerGas', blockData.block.baseFeePerGas )
                    const rewardsObject = {
                        rewardsPerc: rewardsPerc,
                        gasUsedRatio: gasUsedRatioBlock,
                    }
                    const {_id, ...cleanBlockData} = blockData
                    const newBlockData = {
                        ...cleanBlockData,
                        rewards: rewardsObject
                    }
                    try {
                        db.collection(`complete-grouped-blocks-data-rewards`).insertOne(newBlockData, function(err, res) {
                            if (err) throw err;
                            console.log('count', count)
                            count += 1
                        })
                    } catch(e) {
                        //
                    }
                }
            }
        }
    }

}

const dedupe = async (collectionName) => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("consolidated")
    let count = 0
    const createdBlocks = []

    const currentBlockData = await db.collection('complete-grouped-blocks-data-rewards').find()
    let blockExists = await currentBlockData.hasNext()
    while (blockExists) {
        const blockData = await currentBlockData.next()
        if (!createdBlocks.includes(blockData.blockNumber)) {
            createdBlocks.push(blockData.blockNumber)
            const {_id, ...cleanBlockData} = blockData
            try {
                db.collection(`complete-grouped-blocks-data-rewards-deduped`).insertOne(cleanBlockData, function(err, res) {
                    if (err) throw err;
                    console.log('count', count)
                    count += 1
                })
            } catch(e) {
                //
            }
        }
        blockExists = await currentBlockData.hasNext()
    }
}

dedupe()