import fs from 'fs';

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

const maxBaseFeeAnalytics = async (mult, file, getSuggestedBaseFee, label) => {
    let aboveAtCurrentBlock = 0
    let aboveAtFirstBlock = 0
    let aboveAtSecondBlock = 0
    let aboveAtThirdBlock = 0
    let aboveAtFourthBlock = 0
    let aboveAtFifthBlock = 0
    let totalBlocks = 0

    const jsonString = await fs.readFileSync(`./${file}.json`, 'utf8')
    const blocks = JSON.parse(jsonString)

    const blockNumberOrdered = Object.keys(blocks).sort()
    totalBlocks = 0
    const getBlockAt = (blockNumber) => {
        return blocks[`${blockNumber}`]
    }
    let overpaid = 0
    let c = 0
    const overpaidArray = []
    console.log('blpockskksksk ', blockNumberOrdered.length)
    blockNumberOrdered.forEach((blockNumber, i) => {
        c += 1
        const n = Number(blockNumber)
        const currentBlock = getBlockAt(n)
        const getBlockBaseFee = currentBlock => currentBlock?.block?.baseFeePerGas || 0
        if (!currentBlock || !currentBlock || !currentBlock.block || getBlockBaseFee(currentBlock) === 0) return
        const suggestedBaseFee = getSuggestedBaseFee(currentBlock)
        totalBlocks += 1
        // current block
        if (currentBlock && suggestedBaseFee*mult > getBlockBaseFee(currentBlock)) {
            aboveAtCurrentBlock += 1
            overpaid += suggestedBaseFee*mult - getBlockBaseFee(currentBlock)
            overpaidArray.push(suggestedBaseFee*mult - getBlockBaseFee(currentBlock))
            return
        }
        // first block
        const firstBlock = getBlockAt(n+1)
        if (firstBlock && Number(suggestedBaseFee) * mult > getBlockBaseFee(firstBlock)) {
            aboveAtFirstBlock += 1
            overpaid += suggestedBaseFee*mult - getBlockBaseFee(firstBlock)
            overpaidArray.push(suggestedBaseFee*mult - getBlockBaseFee(firstBlock))
            return
        }
        // second block
        const secondBlock = getBlockAt(n+2)
        if (secondBlock && Number(suggestedBaseFee) * mult > getBlockBaseFee(secondBlock)) {
            aboveAtSecondBlock += 1
            overpaid += suggestedBaseFee*mult - getBlockBaseFee(secondBlock)
            overpaidArray.push(suggestedBaseFee*mult - getBlockBaseFee(secondBlock))
            return
        }

        // third block
        const thirdBlock = getBlockAt(n+3)
        if (thirdBlock&& Number(suggestedBaseFee)*mult > getBlockBaseFee(thirdBlock)) {
            aboveAtThirdBlock += 1
            overpaid += suggestedBaseFee*mult - getBlockBaseFee(thirdBlock)
            overpaidArray.push(suggestedBaseFee*mult - getBlockBaseFee(thirdBlock))
            return
        }

        // fourth block
        const fourthBlock = getBlockAt(n+4)
        if (fourthBlock&& Number(suggestedBaseFee)*mult > getBlockBaseFee(fourthBlock)) {
            aboveAtFourthBlock += 1
            overpaid += suggestedBaseFee*mult - getBlockBaseFee(fourthBlock)
            overpaidArray.push(suggestedBaseFee*mult - getBlockBaseFee(fourthBlock))
            return
        }

        // fifth block
        const fifthBlock = getBlockAt(n+5)
        if (fifthBlock&& Number(suggestedBaseFee)*mult > getBlockBaseFee(fifthBlock)) {
            aboveAtFifthBlock += 1
            overpaid += suggestedBaseFee*mult - getBlockBaseFee(fifthBlock)
            overpaidArray.push(suggestedBaseFee*mult - getBlockBaseFee(fifthBlock))
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
    const row = `${label},${fixed(confirmedAtCurrentBlock)},${fixed(confirmedAtFirstBlockOrBefore)},${fixed(confirmedAtSecondBlockOrBefore)},${fixed(confirmedAtThirdBlockOrBefore)},${fixed(confirmedAtFourthBlockOrBefore)},${fixed(confirmedAtFifthBlockOrBefore)},${overpaid/totalBlocks},${median(overpaidArraySorted)},${overpaidArraySorted[perc70N]}`
    console.log(row)
    console.log('overpaid: ', overpaid/totalBlocks)
    console.log('median overpaid', median(overpaidArray))
    console.log('TOTALBLOCKS', totalBlocks)
    return row
    // rows.push(row)
}

const runIt = async () => {
    const file = 'complete-grouped-blocks-data-basefee-estimations'

    const row1 = await maxBaseFeeAnalytics(1, file, block => block.estimatedBaseFee, 'Mult 1')
    const row2 = await maxBaseFeeAnalytics(1.025, file, block => block.estimatedBaseFee, 'Mult 1.025')
    const row3 =await   maxBaseFeeAnalytics(1.05, file, block => block.estimatedBaseFee, 'Mult 1.05')
    const row4 =await  maxBaseFeeAnalytics(1.1, file, block => block.estimatedBaseFee, 'Mult 1.1')
    const row5 =await maxBaseFeeAnalytics(1.2, file, block => block.estimatedBaseFee, 'Mult 1.2')

    console.log('row1', row1)
    console.log('row2', row2)
    console.log('row3', row3)
    console.log('row4', row4)
    console.log('row5', row5)
    const rows = [row1, row2,row3,row4,row5]

    let writeStream = fs.createWriteStream(`./analytics_basefee_@.csv`)

    writeStream.write('Multiplier,Match current block,Match 1st block,Match 2nd block,Match 3rd block,Match 4th block,Match 5th block,Overpaid mean,Overpaid median,Overpaid perc 75'+'\n')
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

runIt()
