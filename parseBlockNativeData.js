// import {
//     ma, dma, ema, sma, wma
//   } from 'moving-averages'
import fs from 'fs'


const parseData = async () => {
    const fileName = './blockNativeDataWithBlockmonday.json'
    try {
        fs.readFile(fileName, 'utf8', (err, jsonString) => {
            if (err) {
                console.log("File read failed:", err)
                return
            }
            try {
                const entries = JSON.parse(jsonString)
                let currentBlock = Number(entries[0].blockNumber)
                const newEntries = []

                const blocks = entries.map(({blockNumber}) => Number(blockNumber))
                console.log('blocks', blocks)
                const minBlock = Math.min(...blocks)
                const maxBlock = Math.max(...blocks)
                const diffBlocks = maxBlock-minBlock
                console.log('maxBlock',maxBlock)
                console.log('minBlock',minBlock)
                console.log('completeBlocksArray',diffBlocks)
                const completeBlocksArray = Array.from(Array(diffBlocks).keys(), x => x + currentBlock)
                console.log('completeBlocksArray',completeBlocksArray.length)
                const missingBlocks = completeBlocksArray.filter((blockNumber) => !blocks.includes(blockNumber))
                console.log('missingBlocks', missingBlocks.length)

                entries.map((entry) => {
                    newEntries.push({...entry}) 
                })
                missingBlocks.map((missedBlock) => {
                    const prevBlock = newEntries.find(({blockNumber}) => blockNumber === missedBlock - 1) 
                    if (prevBlock) {
                        newEntries.push({...prevBlock, blockNumber: missedBlock})
                        return
                    }
                    const prev2Block = newEntries.find(({blockNumber}) => blockNumber === missedBlock - 2) 
                    if (prev2Block) {
                        newEntries.push({...prev2Block, blockNumber: missedBlock})
                        return
                    }
                })
                // const ss = JSON.stringify(newEntries)
    
                // fs.writeFile('./monday_13486948_13489088_13483769_blockNativeDataWithBlock.json', ss, err => {
                //     if (err) {
                //         console.log('Error writing file', err)
                //     } else {
                //         console.log('Successfully wrote file')
                //     }
                // })

                const aa = JSON.stringify(newEntries.map(({blockNumber})=> blockNumber))

                fs.writeFile('./monday_13486948_13489088_13483769_blockNativeData_blocksarray.json', aa, err => {
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
    } catch(e) {
        console.log('e', e)
    }
}

parseData()