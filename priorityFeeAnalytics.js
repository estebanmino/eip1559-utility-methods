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

const maxTipAnalytics = async (mult, file, getSuggestedPriorityFee, label) => {
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
    let sumOfsuggestePriorityFee = 0
    blockNumberOrdered.forEach((blockNumber, i) => {
        c += 1
        const n = Number(blockNumber)
        const currentBlock = getBlockAt(n)
        const getBlockMinPriorityFee = currentBlock => currentBlock?.block?.priorityFee?.minPriorityFee || 0
        if (!currentBlock || !currentBlock || !currentBlock.block || getBlockMinPriorityFee(currentBlock) === 0) return
        const suggestePriorityFee = getSuggestedPriorityFee(currentBlock)
        totalBlocks += 1

        sumOfsuggestePriorityFee+= suggestePriorityFee
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
    const row = `${label},${fixed(confirmedAtCurrentBlock)},${fixed(confirmedAtFirstBlockOrBefore)},${fixed(confirmedAtSecondBlockOrBefore)},${fixed(confirmedAtThirdBlockOrBefore)},${fixed(confirmedAtFourthBlockOrBefore)},${fixed(confirmedAtFifthBlockOrBefore)},${overpaid/totalBlocks},${median(overpaidArraySorted)},${overpaidArraySorted[perc70N]},${sumOfsuggestePriorityFee/totalBlocks}`
    console.log(row)
    console.log('overpaid: ', overpaid/totalBlocks)
    console.log('median overpaid', median(overpaidArray))
    console.log('TOTALBLOCKS', totalBlocks)
    return row
    // rows.push(row)
}

const runIt = async () => {
    const file = 'complete-grouped-blocks-data-rewards-ema-outliers-reverse'
    const numberSteps = [
        [block => 1, 'number 1'],
        [block => 1.5, 'number 1.5'],
        [block => 2, 'number 2'],
        [block => 3, 'number 3'],
        [block => 5, 'number 5'],
        [block => 10, 'number 10'],
    ]
    const emaCompleteSteps = [
        [block => block.emaPerc.emaComplete.emaPerc5, 'emaComplete.perc5'],
        [block => block.emaPerc.emaComplete.emaPerc10, 'emaComplete.perc10'],
        [block => block.emaPerc.emaComplete.emaPerc15, 'emaComplete.perc15'],
        [block => Math.max(block.emaPerc.emaComplete.emaPerc15, 1), 'max(emaComplete.perc15-1)'],
        [block => Math.min(Math.max(block.emaPerc.emaComplete.emaPerc15, 1), 1.8), 'min(max(emaComplete.perc15-1)-1.8)'],
        [block => Math.min(Math.max(block.emaPerc.emaComplete.emaPerc15, 1), 2.2), 'min(max(emaComplete.perc15-1)-2.2)'],
        [block => block.emaPerc.emaComplete.emaPerc20, 'emaComplete.perc20'],
        [block => block.emaPerc.emaComplete.emaPerc25, 'emaComplete.perc25'],
        [block => block.emaPerc.emaComplete.emaPerc30, 'emaComplete.perc30'],
        [block => Math.max(block.emaPerc.emaComplete.emaPerc30, 1.5), 'max(emaComplete.perc30-1.5)'],
        [block => Math.min(Math.max(block.emaPerc.emaComplete.emaPerc30, 1.5), 5), 'min(max(emaComplete.perc30-1.5)-5)'],
        [block => Math.min(Math.max(block.emaPerc.emaComplete.emaPerc30, 1.5), 10), 'min(max(emaComplete.perc30-1.5)-10)'],
        [block => block.emaPerc.emaComplete.emaPerc35, 'emaComplete.perc35'],
        [block => block.emaPerc.emaComplete.emaPerc40, 'emaComplete.perc40'],
        [block => block.emaPerc.emaComplete.emaPerc45, 'emaComplete.perc45'],
        [block => Math.max(block.emaPerc.emaComplete.emaPerc45, 2), 'max(emaComplete.emaPerc45-2)'],
        [block => Math.min(Math.max(block.emaPerc.emaComplete.emaPerc45, 2), 5), 'min(max(emaComplete.emaPerc45-1)-5)'],
        [block => Math.min(Math.max(block.emaPerc.emaComplete.emaPerc45, 2), 10), 'min(max(emaComplete.emaPerc45-1)-10)'],
        [block => block.emaPerc.emaComplete.emaPerc50, 'emaComplete.perc50'],
    ]
    const emaNoOutlier10Steps = [
        [block => block.emaPerc.emaNoOutlier10.emaPerc5, 'emaNoOutlier10.perc5'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc10, 'emaNoOutlier10.perc10'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc15, 'emaNoOutlier10.perc15'],
        [block => Math.max(block.emaPerc.emaNoOutlier10.emaPerc15, 1), 'max(emaNoOutlier10.perc15-1)'],
        [block => Math.min(Math.max(block.emaPerc.emaNoOutlier10.emaPerc15, 1), 1.8), 'min(max(emaNoOutlier10.perc15-1)-1.8)'],
        [block => Math.min(Math.max(block.emaPerc.emaNoOutlier10.emaPerc15, 1), 2.2), 'min(max(emaNoOutlier10.perc15-1)-2.2)'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc20, 'emaNoOutlier10.perc20'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc25, 'emaNoOutlier10.perc25'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc30, 'emaNoOutlier10.perc30'],
        [block => Math.max(block.emaPerc.emaNoOutlier10.emaPerc30, 1.5), 'max(emaNoOutlier10.perc30-1.5)'],
        [block => Math.min(Math.max(block.emaPerc.emaNoOutlier10.emaPerc30, 1.5), 5), 'min(max(emaNoOutlier10.perc30-1.5)-5)'],
        [block => Math.min(Math.max(block.emaPerc.emaNoOutlier10.emaPerc30, 1.5), 10), 'min(max(emaNoOutlier10.perc30-1.5)-10)'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc35, 'emaNoOutlier10.perc35'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc40, 'emaNoOutlier10.perc40'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc45, 'emaNoOutlier10.perc45'],
        [block => Math.max(block.emaPerc.emaNoOutlier10.emaPerc45, 2), 'max(emaNoOutlier10.emaPerc45-2)'],
        [block => Math.min(Math.max(block.emaPerc.emaNoOutlier10.emaPerc45, 2), 5), 'min(max(emaNoOutlier10.emaPerc45-1)-5)'],
        [block => Math.min(Math.max(block.emaPerc.emaNoOutlier10.emaPerc45, 2), 10), 'min(max(emaNoOutlier10.emaPerc45-1)-10)'],
        [block => block.emaPerc.emaNoOutlier10.emaPerc50, 'emaNoOutlier10.perc50'],
    ]

    const emaNoOutlier16Steps = [
        [block => block.emaPerc.emaNoOutlier16.emaPerc5, 'emaNoOutlier16.perc5'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc10, 'emaNoOutlier16.perc10'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc15, 'emaNoOutlier16.perc15'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc20, 'emaNoOutlier16.perc20'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc25, 'emaNoOutlier16.perc25'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc30, 'emaNoOutlier16.perc30'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc35, 'emaNoOutlier16.perc35'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc40, 'emaNoOutlier16.perc40'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc45, 'emaNoOutlier16.perc45'],
        [block => block.emaPerc.emaNoOutlier16.emaPerc50, 'emaNoOutlier16.perc50'],
    ]
    const rows = []

    rows.push('Plain Numbers')
    for (let i = 0; i < numberSteps.length; i++) {
        const row = await maxTipAnalytics(
            1,
            file,
            numberSteps[i][0],
            numberSteps[i][1]
        )
        rows.push(row)
    }

    rows.push('Full data')
    
    for (let i = 0; i < emaCompleteSteps.length; i++) {
        const row = await maxTipAnalytics(
            1,
            file,
            emaCompleteSteps[i][0],
            emaCompleteSteps[i][1]
        )
        rows.push(row)
    }

    rows.push('Without outliers (>10)')

    for (let i = 0; i < emaNoOutlier10Steps.length; i++) {
        const row = await maxTipAnalytics(
            1,
            file,
            emaNoOutlier10Steps[i][0],
            emaNoOutlier10Steps[i][1]
        )
        rows.push(row)

    }

    rows.push('Without outliers (>16)')

    for (let i = 0; i < emaNoOutlier16Steps.length; i++) {
        const row = await maxTipAnalytics(
            1,
            file,
            emaNoOutlier16Steps[i][0],
            emaNoOutlier16Steps[i][1]
        )
        rows.push(row)
    }
    let writeStream = fs.createWriteStream(`./analytics_ema_reversed_full_3.csv`)

    writeStream.write('As miner tip,Match current block,Match 1st block,Match 2nd block,Match 3rd block,Match 4th block,Match 5th block,Overpaid mean,Overpaid median,Overpaid perc 75,Suggested mean'+'\n')
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
