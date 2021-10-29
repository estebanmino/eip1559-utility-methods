
import fs from 'fs'


// first block
// not first block and second block
// not second block and third block

const analytics = async (mult) => {
    let aboveAtCurrentBlock = 0
    let aboveAtFirstBlock = 0
    let aboveAtSecondBlock = 0
    let aboveAtThirdBlock = 0
    let aboveAtFourthBlock = 0
    let aboveAtFifthBlock = 0
    let totalBlocks = 0
    fs.readFile('./thousandBlocksDataFrom13461665.json', 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        }
        const blocks = JSON.parse(jsonString)

        const blockNumberOrdered = Object.keys(blocks).sort()
        totalBlocks = blockNumberOrdered.length
        const getBlockAt = (blockNumber) => blocks[blockNumber]

        blockNumberOrdered.forEach((blockNumber) => {
            const n = Number(blockNumber)
            const currentBlock = getBlockAt(n)
            // current block
            if (currentBlock && currentBlock.maxSuggestedBaseFee*mult > currentBlock.baseFeePerGas) {
                aboveAtCurrentBlock += 1
                return
            }
            // first block
            const firstBlock = getBlockAt(n+1)
            if (firstBlock && Number(currentBlock.maxSuggestedBaseFee) * mult > Number(firstBlock.baseFeePerGas)) {
                aboveAtFirstBlock += 1
                return
            }
            // second block
            const secondBlock = getBlockAt(n+2)
            if (secondBlock && Number(currentBlock.maxSuggestedBaseFee) * mult > Number(secondBlock.baseFeePerGas)) {
                aboveAtSecondBlock += 1
                return
            }

            // third block
            const thirdBlock = getBlockAt(n+3)
            if (thirdBlock&& Number(currentBlock.maxSuggestedBaseFee)*mult > Number(thirdBlock.baseFeePerGas)) {
                aboveAtThirdBlock += 1
                return
            }

            // fourth block
            const fourthBlock = getBlockAt(n+4)
            if (fourthBlock&& Number(currentBlock.maxSuggestedBaseFee)*mult > Number(fourthBlock.baseFeePerGas)) {
                aboveAtFourthBlock += 1
                return
            }

            // fifth block
            const fifthBlock = getBlockAt(n+5)
            if (fifthBlock&& Number(currentBlock.maxSuggestedBaseFee)*mult > Number(fifthBlock.baseFeePerGas)) {
                aboveAtFifthBlock += 1
                return
            }
            
        })

        // console.log('Total blocks: ', totalBlocks)

        const getPerc = n => {
            return (n/totalBlocks)
        }
        // console.log('Total aboveAtCurrentBlock: ', getPerc(aboveAtCurrentBlock))
        const confirmedFirstBlock = getPerc(aboveAtFirstBlock)
        const confirmedSecondBlock = getPerc(aboveAtSecondBlock)
        const confirmedThirdBlock = getPerc(aboveAtThirdBlock)
        const confirmedFourthBlock = getPerc(aboveAtFourthBlock)
        const confirmedFifthBlock = getPerc(aboveAtFifthBlock)

        const confirmedAtCurrentBlock = getPerc(aboveAtCurrentBlock)
        const confirmedAtFirstBlockOrBefore = confirmedAtCurrentBlock + confirmedFirstBlock
        const confirmedAtSecondBlockOrBefore = confirmedAtFirstBlockOrBefore + confirmedSecondBlock
        const confirmedAtThirdBlockOrBefore = confirmedAtSecondBlockOrBefore + confirmedThirdBlock
        const confirmedAtFourthBlockOrBefore = confirmedAtThirdBlockOrBefore + confirmedFourthBlock
        const confirmedAtFifthBlockOrBefore = confirmedAtFourthBlockOrBefore + confirmedFifthBlock

        const fixed = (a) => a 
        const row = `${mult},${fixed(confirmedAtCurrentBlock)},${fixed(confirmedAtFirstBlockOrBefore)},${fixed(confirmedAtSecondBlockOrBefore)},${fixed(confirmedAtThirdBlockOrBefore)},${fixed(confirmedAtFourthBlockOrBefore)},${fixed(confirmedAtFifthBlockOrBefore)}`
        console.log(row)
    })
}

const  linearRegression = (y,x) => {
    let lr = {};
    let n = y.length;
    let sum_x = 0;
    let sum_y = 0;
    let sum_xy = 0;
    let sum_xx = 0;
    let sum_yy = 0;

    for ( i = 0; i < y.length; i++) {
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

const GAS_CONFIDENCE = {
    70: 'slower',
    80: 'slow',
    90: 'normal',
    95: 'fast',
    99: 'urgent',
  };

const formatData = () => {
    const fileName = './blockNativeAndOnChainWithDataPerc102025304050.json';
    // const file = require(fileName);
    fs.readFile(fileName, 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        }
        try {
            const entries = JSON.parse(jsonString)
            const newFormat = {}
            const newEntries = entries.map((entry) => {
                const numberBlock = Number(entry.blockNumber)
                newFormat[numberBlock] = {...entry} 
            })
            // const newEntries = entries.map((entry) => Number(entry.blockNumber))
            const ss = JSON.stringify(newFormat)

            fs.writeFile('./BYBLOCK_blockNativeAndOnChainWithDataPerc102025304050.json', ss, err => {
                if (err) {
                    console.log('Error writing file', err)
                } else {
                    console.log('Successfully wrote file')
                }
            })
    } catch(err) {
            console.log('Error parsing JSON string:', err)
        }
    })
}

const maxBaseAnalytics = async (mult) => {
    let aboveAtCurrentBlock = 0
    let aboveAtFirstBlock = 0
    let aboveAtSecondBlock = 0
    let aboveAtThirdBlock = 0
    let aboveAtFourthBlock = 0
    let aboveAtFifthBlock = 0
    let totalBlocks = 0
    fs.readFile('./blockNativeAndOnChainWithDataByBlockWithMedian.json', 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        }
        const blocks = JSON.parse(jsonString)

        const blockNumberOrdered = Object.keys(blocks).sort()
        totalBlocks = blockNumberOrdered.length
        const getBlockAt = (blockNumber) => blocks[blockNumber]
        blockNumberOrdered.forEach((blockNumber) => {
            const n = Number(blockNumber)
            const currentBlock = getBlockAt(n)
            const suggestedBaseFee = currentBlock.suggestedMaxBaseFee.max*mult
            // current block
            if (currentBlock && suggestedBaseFee*mult > currentBlock.blockBaseFee) {
                aboveAtCurrentBlock += 1
                return
            }
            // first block
            const firstBlock = getBlockAt(n+1)
            if (firstBlock && Number(suggestedBaseFee) * mult > Number(firstBlock.blockBaseFee)) {
                aboveAtFirstBlock += 1
                return
            }
            // second block
            const secondBlock = getBlockAt(n+2)
            if (secondBlock && Number(suggestedBaseFee) * mult > Number(secondBlock.blockBaseFee)) {
                aboveAtSecondBlock += 1
                return
            }

            // third block
            const thirdBlock = getBlockAt(n+3)
            if (thirdBlock&& Number(suggestedBaseFee)*mult > Number(thirdBlock.blockBaseFee)) {
                aboveAtThirdBlock += 1
                return
            }

            // fourth block
            const fourthBlock = getBlockAt(n+4)
            if (fourthBlock&& Number(suggestedBaseFee)*mult > Number(fourthBlock.blockBaseFee)) {
                aboveAtFourthBlock += 1
                return
            }

            // fifth block
            const fifthBlock = getBlockAt(n+5)
            if (fifthBlock&& Number(suggestedBaseFee)*mult > Number(fifthBlock.blockBaseFee)) {
                aboveAtFifthBlock += 1
                return
            }
            
        })

        // console.log('Total blocks: ', totalBlocks)
        const getPerc = n => {
            return (n/totalBlocks)
        }
        // console.log('Total aboveAtCurrentBlock: ', getPerc(aboveAtCurrentBlock))
        const confirmedFirstBlock = getPerc(aboveAtFirstBlock)
        const confirmedSecondBlock = getPerc(aboveAtSecondBlock)
        const confirmedThirdBlock = getPerc(aboveAtThirdBlock)
        const confirmedFourthBlock = getPerc(aboveAtFourthBlock)
        const confirmedFifthBlock = getPerc(aboveAtFifthBlock)

        const confirmedAtCurrentBlock = getPerc(aboveAtCurrentBlock)
        const confirmedAtFirstBlockOrBefore = confirmedAtCurrentBlock + confirmedFirstBlock
        const confirmedAtSecondBlockOrBefore = confirmedAtFirstBlockOrBefore + confirmedSecondBlock
        const confirmedAtThirdBlockOrBefore = confirmedAtSecondBlockOrBefore + confirmedThirdBlock
        const confirmedAtFourthBlockOrBefore = confirmedAtThirdBlockOrBefore + confirmedFourthBlock
        const confirmedAtFifthBlockOrBefore = confirmedAtFourthBlockOrBefore + confirmedFifthBlock

        const fixed = (a) => a 
        const row = `${mult},${fixed(confirmedAtCurrentBlock)},${fixed(confirmedAtFirstBlockOrBefore)},${fixed(confirmedAtSecondBlockOrBefore)},${fixed(confirmedAtThirdBlockOrBefore)},${fixed(confirmedAtFourthBlockOrBefore)},${fixed(confirmedAtFifthBlockOrBefore)}`
        console.log(row)
        
    })
}


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

const rows = []

const maxTipAnalytics = async (mult, file, getSuggestedPriorityFee, label) => {
    let aboveAtCurrentBlock = 0
    let aboveAtFirstBlock = 0
    let aboveAtSecondBlock = 0
    let aboveAtThirdBlock = 0
    let aboveAtFourthBlock = 0
    let aboveAtFifthBlock = 0
    let totalBlocks = 0
    fs.readFile(`./${file}`, 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        }
        const blocks = JSON.parse(jsonString)

        const blockNumberOrdered = Object.keys(blocks).sort()
        totalBlocks = 0
        const getBlockAt = (blockNumber) => {
            return blocks[`${blockNumber}`]
        }
        let overpaid = 0
        let c = 0
        const overpaidArray = []
        blockNumberOrdered.forEach((blockNumber, i) => {
            c += 1
            const n = Number(blockNumber)
            const currentBlock = getBlockAt(n)
            const getBlockMinPriorityFee = currentBlock => currentBlock?.block?.priorityFee?.minPriorityFee || 0
            if (!currentBlock || !currentBlock || !currentBlock.block || getBlockMinPriorityFee(currentBlock) === 0) return
            const suggestePriorityFee = getSuggestedPriorityFee(currentBlock)
            totalBlocks += 1
            // normal currentBlock.data.ema.n10.perc20 > 1.49 ?currentBlock.data.ema.n10.perc20 : 1.49

            // current block
            if (currentBlock && suggestePriorityFee*mult > getBlockMinPriorityFee(currentBlock)) {
                aboveAtCurrentBlock += 1
                overpaid += suggestePriorityFee*mult - getBlockMinPriorityFee(currentBlock)
                overpaidArray.push(suggestePriorityFee*mult - getBlockMinPriorityFee(currentBlock))
                return
            }
            // first block
            const firstBlock = getBlockAt(n+1)
            if (firstBlock && Number(suggestePriorityFee) * mult > getBlockMinPriorityFee(firstBlock)) {
                aboveAtFirstBlock += 1
                overpaid += suggestePriorityFee*mult - getBlockMinPriorityFee(firstBlock)
                overpaidArray.push(suggestePriorityFee*mult - getBlockMinPriorityFee(firstBlock))
                return
            }
            // second block
            const secondBlock = getBlockAt(n+2)
            if (secondBlock && Number(suggestePriorityFee) * mult > getBlockMinPriorityFee(secondBlock)) {
                aboveAtSecondBlock += 1
                overpaid += suggestePriorityFee*mult - getBlockMinPriorityFee(secondBlock)
                overpaidArray.push(suggestePriorityFee*mult - getBlockMinPriorityFee(secondBlock))
                return
            }

            // third block
            const thirdBlock = getBlockAt(n+3)
            if (thirdBlock&& Number(suggestePriorityFee)*mult > getBlockMinPriorityFee(thirdBlock)) {
                aboveAtThirdBlock += 1
                overpaid += suggestePriorityFee*mult - getBlockMinPriorityFee(thirdBlock)
                overpaidArray.push(suggestePriorityFee*mult - getBlockMinPriorityFee(thirdBlock))
                return
            }

            // fourth block
            const fourthBlock = getBlockAt(n+4)
            if (fourthBlock&& Number(suggestePriorityFee)*mult > getBlockMinPriorityFee(fourthBlock)) {
                aboveAtFourthBlock += 1
                overpaid += suggestePriorityFee*mult - getBlockMinPriorityFee(fourthBlock)
                overpaidArray.push(suggestePriorityFee*mult - getBlockMinPriorityFee(fourthBlock))
                return
            }

            // fifth block
            const fifthBlock = getBlockAt(n+5)
            if (fifthBlock&& Number(suggestePriorityFee)*mult > getBlockMinPriorityFee(fifthBlock)) {
                aboveAtFifthBlock += 1
                overpaid += suggestePriorityFee*mult - getBlockMinPriorityFee(fifthBlock)
                overpaidArray.push(suggestePriorityFee*mult - getBlockMinPriorityFee(fifthBlock))
                return
            }
            
        })

        // console.log('Total blocks: ', totalBlocks)
        const getPerc = n => {
            return (n/totalBlocks)
        }
        // console.log('Total aboveAtCurrentBlock: ', getPerc(aboveAtCurrentBlock))
        const confirmedFirstBlock = getPerc(aboveAtFirstBlock)
        const confirmedSecondBlock = getPerc(aboveAtSecondBlock)
        const confirmedThirdBlock = getPerc(aboveAtThirdBlock)
        const confirmedFourthBlock = getPerc(aboveAtFourthBlock)
        const confirmedFifthBlock = getPerc(aboveAtFifthBlock)

        const confirmedAtCurrentBlock = getPerc(aboveAtCurrentBlock)
        const confirmedAtFirstBlockOrBefore = confirmedAtCurrentBlock + confirmedFirstBlock
        const confirmedAtSecondBlockOrBefore = confirmedAtFirstBlockOrBefore + confirmedSecondBlock
        const confirmedAtThirdBlockOrBefore = confirmedAtSecondBlockOrBefore + confirmedThirdBlock
        const confirmedAtFourthBlockOrBefore = confirmedAtThirdBlockOrBefore + confirmedFourthBlock
        const confirmedAtFifthBlockOrBefore = confirmedAtFourthBlockOrBefore + confirmedFifthBlock

        const perc70N = Math.floor(overpaidArray.length*3/4)
        const fixed = (a) => `${a.toFixed(4)}` 
        const overpaidArraySorted = overpaidArray.sort()
        console.log('perc70N', perc70N, overpaidArray[perc70N])
        const row = `${label},${fixed(confirmedAtCurrentBlock)},${fixed(confirmedAtFirstBlockOrBefore)},${fixed(confirmedAtSecondBlockOrBefore)},${fixed(confirmedAtThirdBlockOrBefore)},${fixed(confirmedAtFourthBlockOrBefore)},${fixed(confirmedAtFifthBlockOrBefore)},${overpaid/totalBlocks},${median(overpaidArraySorted)},${overpaidArraySorted[perc70N]}`
        console.log(row)
        console.log('overpaid: ', overpaid/totalBlocks)
        console.log('median overpaid', median(overpaidArray))
        console.log('TOTALBLOCKS', totalBlocks)
        
        rows.push(row)
    })
}

// formatData()
// maxTipAnalytics(1, 'byblock_90perc.json')
// maxTipAnalytics(1, 'byblock_5Blocks.json')

// 1
// ./data/BYBLOCK_blockNativeAndOnChainWithDataPerc102025304050.json


const run = async (fileName) => {
    // const file = 'data/blockNativeAndOnChainWithDataPerc102025304050.json'
    // const file = 'byblock_blocks_13469671_13475404_full.json'
    const file = `${fileName}.json`


    await maxTipAnalytics(1, file, (currentBlock) => 16, '1')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => 1.5, '1.5')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => 2, '2')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc10, 'emaPerc10')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc15, 'emaPerc15')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => Math.max(currentBlock.suggestions.maxPriorityFee.ema.emaPerc20, 1), 'max emaPerc20 - 1')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc20, 'emaPerc20')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc25, 'emaPerc25')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => Math.max(currentBlock.suggestions.maxPriorityFee.ema.emaPerc25, 1), 'max(emaPerc25 - 1)')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc30, 'emaPerc30')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => Math.max(currentBlock.suggestions.maxPriorityFee.ema.emaPerc30, 1.5), 'max(emaPerc30 - 1.5)')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc35, 'emaPerc35')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => Math.max(currentBlock.suggestions.maxPriorityFee.ema.emaPerc45, 2), 'max(emaPerc45 - 2)')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc45, 'emaPerc45')
    await new Promise(res=> setTimeout(() => res(), (500)))
    await maxTipAnalytics(1, file, (currentBlock) => currentBlock.suggestions.maxPriorityFee.ema.emaPerc50, 'emaPerc50')
    await new Promise(res=> setTimeout(() => res(), (500)))

    // await maxTipAnalytics(1, file, (currentBlock) => currentBlock.blocknative.urgent, 'blocknative.urgent')
    // await new Promise(res=> setTimeout(() => res(), (500)))
    // await maxTipAnalytics(1, file, (currentBlock) => currentBlock.blocknative.fast, 'blocknative.fast')
    // await new Promise(res=> setTimeout(() => res(), (500)))
    // await maxTipAnalytics(1, file, (currentBlock) => currentBlock.blocknative.normal, 'blocknative.normal')
    // await new Promise(res=> setTimeout(() => res(), (500)))

    let writeStream = fs.createWriteStream(`./analytics_${fileName}??.csv`)

    rows.forEach((row, index) => {     
        writeStream.write(row + '\n')
    })

    writeStream.end()

    writeStream.on('finish', () => {
        console.log('finish write stream, moving along')
    }).on('error', (err) => {
        console.log(err)
    })
}
run('complete-grouped-blocks-data-rewards-ema-outliers-reverse')