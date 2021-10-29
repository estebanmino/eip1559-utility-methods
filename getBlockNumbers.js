import fs from 'fs';

const getBlockNumbers = async () => {
    const jsonString = await fs.readFileSync(`complete-grouped-blocks-data.json`, 'utf8')
    const blocks = JSON.parse(jsonString).map(({blockNumber}) => Number(blockNumber))
    console.log('blocks.le', blocks.length)
    fs.writeFile('complete-grouped-blocks-data-block-numbers.json', JSON.stringify(blocks), err => {
        if (err) {
          console.error(err)
          return
        }
      })
}

getBlockNumbers()
