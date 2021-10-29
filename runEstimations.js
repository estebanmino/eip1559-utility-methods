import fs from 'fs';
import { JsonRpcProvider } from '@ethersproject/providers';
import {MongoClient} from 'mongodb'
import BigNumber from 'bignumber.js';
import { ema, sma, wma, ma } from 'moving-averages';

const url = "mongodb://localhost:27017/";

const getNPreviousBlocks = async (db, n, fromBlock) => {
    const blocks = []
    let count = 1
    // from = 11
    while (count < n+1) {
        const a = fromBlock-count
        const blockCursor = await db.collection('complete-grouped-blocks-data-rewards-deduped').find({ blockNumber: a })
        const blockExists = await blockCursor.hasNext()
        if (blockExists) {
            const block = await blockCursor.next()
            // check ema
            // [0, 1, 2, 3, ... , 9, 10]
            blocks.unshift(block)
        }
        count++
    }
    return blocks
}

const runEstimations = async () => {

    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("consolidated")
    let count = 0
    const currentBlockData = await db.collection('complete-grouped-blocks-data-rewards-deduped').find()
    let blockExists = await currentBlockData.hasNext()
    while (blockExists) {
    const currentBlock = await currentBlockData.next()
        const blocks = await getNPreviousBlocks(db, 10, currentBlock.blockNumber)
        if (blocks.length > 9) {
            const perc5 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc5)
            const perc10 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc10)
            const perc15 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc15)
            const perc20 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc20)
            const perc25 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc25)
            const perc30 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc30)
            const perc35 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc35)
            const perc40 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc40)
            const perc45 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc45)
            const perc50 = blocks.map(({ rewards: {rewardsPerc } }) => rewardsPerc.perc50)

            const emaComplete = {
                emaPerc5: ema(perc5, perc5.length).at(-1),
                emaPerc10: ema(perc10, perc10.length).at(-1),
                emaPerc15: ema(perc15, perc15.length).at(-1),
                emaPerc20: ema(perc20, perc20.length).at(-1),
                emaPerc25: ema(perc25, perc25.length).at(-1),
                emaPerc30: ema(perc30, perc30.length).at(-1),
                emaPerc35: ema(perc35, perc35.length).at(-1),
                emaPerc40: ema(perc40, perc40.length).at(-1),
                emaPerc45: ema(perc45, perc45.length).at(-1),
                emaPerc50: ema(perc50, perc50.length).at(-1),
            }

            const removeOutlier = (values, outlier) => {
                return values.map(val => val > outlier ? null : val).filter(a => !!a)
            }

            // outlier 10

            const perc5NoOutlier10 = removeOutlier(perc5, 10)
            const perc10NoOutlier10 = removeOutlier(perc10, 10)
            const perc15NoOutlier10 = removeOutlier(perc15, 10)
            const perc20NoOutlier10 = removeOutlier(perc20, 10)
            const perc25NoOutlier10 = removeOutlier(perc25, 10)
            const perc30NoOutlier10 = removeOutlier(perc30, 10)
            const perc35NoOutlier10 = removeOutlier(perc35, 10)
            const perc40NoOutlier10 = removeOutlier(perc40, 10)
            const perc45NoOutlier10 = removeOutlier(perc45, 10)
            const perc50NoOutlier10 = removeOutlier(perc50, 10)

            const emaNoOutlier10 = {
                emaPerc5: ema(perc5NoOutlier10, perc5NoOutlier10.length).at(-1),
                emaPerc10: ema(perc10NoOutlier10, perc10NoOutlier10.length).at(-1),
                emaPerc15: ema(perc15NoOutlier10, perc15NoOutlier10.length).at(-1),
                emaPerc20: ema(perc20NoOutlier10, perc20NoOutlier10.length).at(-1),
                emaPerc25: ema(perc25NoOutlier10, perc25NoOutlier10.length).at(-1),
                emaPerc30: ema(perc30NoOutlier10, perc30NoOutlier10.length).at(-1),
                emaPerc35: ema(perc35NoOutlier10, perc35NoOutlier10.length).at(-1),
                emaPerc40: ema(perc40NoOutlier10, perc40NoOutlier10.length).at(-1),
                emaPerc45: ema(perc45NoOutlier10, perc45NoOutlier10.length).at(-1),
                emaPerc50: ema(perc50NoOutlier10, perc50NoOutlier10.length).at(-1),
            }

            // outlier 16

            const perc5NoOutlier16 = removeOutlier(perc5, 16)
            const perc10NoOutlier16 = removeOutlier(perc10, 16)
            const perc15NoOutlier16 = removeOutlier(perc15, 16)
            const perc20NoOutlier16 = removeOutlier(perc20, 16)
            const perc25NoOutlier16 = removeOutlier(perc25, 16)
            const perc30NoOutlier16 = removeOutlier(perc30, 16)
            const perc35NoOutlier16 = removeOutlier(perc35, 16)
            const perc40NoOutlier16 = removeOutlier(perc40, 16)
            const perc45NoOutlier16 = removeOutlier(perc45, 16)
            const perc50NoOutlier16 = removeOutlier(perc50, 16)

            const emaNoOutlier16 = {
                emaPerc5: ema(perc5NoOutlier16, perc5NoOutlier16.length).at(-1),
                emaPerc10: ema(perc10NoOutlier16, perc10NoOutlier16.length).at(-1),
                emaPerc15: ema(perc15NoOutlier16, perc15NoOutlier16.length).at(-1),
                emaPerc20: ema(perc20NoOutlier16, perc20NoOutlier16.length).at(-1),
                emaPerc25: ema(perc25NoOutlier16, perc25NoOutlier16.length).at(-1),
                emaPerc30: ema(perc30NoOutlier16, perc30NoOutlier16.length).at(-1),
                emaPerc35: ema(perc35NoOutlier16, perc35NoOutlier16.length).at(-1),
                emaPerc40: ema(perc40NoOutlier16, perc40NoOutlier16.length).at(-1),
                emaPerc45: ema(perc45NoOutlier16, perc45NoOutlier16.length).at(-1),
                emaPerc50: ema(perc50NoOutlier16, perc50NoOutlier16.length).at(-1),
            }

            const emaPerc = {
                emaComplete,
                emaNoOutlier10,
                emaNoOutlier16
            }

            const {_id, ...cleanCurrentBlock} = currentBlock
            const objectWithEma = {...cleanCurrentBlock, emaPerc}
            console.log('objectWithEma', objectWithEma.blockNumber, objectWithEma.emaPerc.emaComplete)
            try {
                // await db.collection('complete-grouped-blocks-data-rewards-sma-reverse').insertOne(objectWithEma, function(err, res) {
                //     if (err) throw err;
                //     console.log('sma(-shifted-count', count)
                //     count += 1
                // })
            } catch(e) {
                //
            }
        }
        blockExists = await currentBlockData.hasNext()
    }
            
    return 1
}

runEstimations()