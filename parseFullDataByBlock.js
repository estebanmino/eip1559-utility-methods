// import {
//     ma, dma, ema, sma, wma
//   } from 'moving-averages'
import fs from 'fs'


const parseData = async () => {
    const fileName = './blocks_13469671_13475404_full.json'
    try {
        fs.readFile(fileName, 'utf8', (err, jsonString) => {
            if (err) {
                console.log("File read failed:", err)
                return
            }
            try {
                const entries = JSON.parse(jsonString)
                let currentBlock = Number(entries[0].blockNumber)
                const newEntries = {}

                entries.forEach((entry) => {
                    newEntries[Number(entry.blockNumber)] = {...entry}
                })
               
                const aa = JSON.stringify(newEntries)

                fs.writeFile('./byblock_blocks_13469671_13475404_full.json', aa, err => {
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