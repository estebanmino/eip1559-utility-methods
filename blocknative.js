
import {MongoClient} from 'mongodb'
import {JsonRpcProvider} from '@ethersproject/providers'
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// first block
// not first block and second block
// not second block and third block

const infuraProvider = new JsonRpcProvider(`https://mainnet.infura.io/v3/`);

let bnData = {}
const GAS_CONFIDENCE = {
    70: 'slower',
    80: 'slow',
    90: 'normal',
    95: 'fast',
    99: 'urgent',
  };

const onNewBlock = async (callback) => {
    const fetching = true
    let lastBlockNumber = 0
    while (fetching) {
        try {
            const blockNumberHex = await infuraProvider.send("eth_blockNumber")
            const blockNumber = Number(blockNumberHex)
            if (blockNumber > lastBlockNumber) {
                lastBlockNumber = blockNumber
                try {
                    callback(blockNumber)
                } catch (e) {
                    console.log('onNewBlock error', e)
                }
            }
        } catch (r){
            //
        }
        await new Promise(res=> setTimeout(() => res(), 2000))
    }
}


const getBlockNativeData = async () => {
    const response = await fetch(`https://api.blocknative.com/gasprices/blockprices`, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json',
        'Authorization': '5b743bdf-9ad8-4ebf-befd-2d05b6e60a69',
        // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    });
    const r = await response.json()
    const blockNumber = r?.blockPrices?.[0]?.blockNumber
    if (!blockNumber) return
    const estimatedPrices = { blockNumber }
    r?.blockPrices?.[0]?.estimatedPrices?.map((est) => {
        estimatedPrices[GAS_CONFIDENCE[est.confidence]] = est.maxPriorityFeePerGas
    })
    return estimatedPrices
}

const infiniteLoop = async (callback, time) => {
    const fetching = true
    while (fetching) {
        callback()
        await new Promise(res=> setTimeout(() => {
            res()
        }, time))
    }
}
var url = "mongodb://localhost:27017/";

const blocks = []
const main = async () => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("mydb")

    let numberOfErrors = 0

    const getBN = async () => {
        try {
            const obj = await getBlockNativeData()
            bnData = obj
        } catch (e) {
            //
        }
    }
    const yeah = async (blockNumber) => {
        try {
            if (Object.keys(bnData).length >= 5 && !blocks.includes(blockNumber)) {
                blocks.push(blockNumber)
                console.log('INSERT', {...bnData, blockNumber })
                db.collection("blockNativeDataWithBlock_thursday").insertOne({...bnData, blockNumber }, function(err, res) {
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

    onNewBlock(yeah)
    infiniteLoop(getBN, 6000)
}

main()