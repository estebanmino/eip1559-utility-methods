import fs from 'fs';
import { JsonRpcProvider } from '@ethersproject/providers';
import {MongoClient} from 'mongodb'
import BigNumber from 'bignumber.js';
import { suggestMaxBaseFee } from 'eip1559-fee-suggestions-ethers';


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

const getBaseFeeEstimations = async () => {
    const mongoClient = new MongoClient(url)
    await mongoClient.connect();
    const db = mongoClient.db("consolidated")
    let count = 0

    const currentBlockData = await db.collection('complete-grouped-blocks-data').find()
    let blockExists = await currentBlockData.hasNext()
    while (blockExists) {
        const blockData = await currentBlockData.next()
        const estimatedBaseFeeWei = await suggestMaxBaseFee(provider, '0x' + Number(blockData.blockNumber).toString(16))
        const {_id, ...cleanBlockData} = blockData
        const newBlockData = {
            ...cleanBlockData,
            estimatedBaseFee: weiToGwei(estimatedBaseFeeWei.baseFeeSuggestion)
        }
        try {
            db.collection(`complete-grouped-blocks-data-basefee-estimations`).insertOne(newBlockData, function(err, res) {
                if (err) throw err;
                console.log('count', count)
                count += 1
            })
        } catch(e) {
            //
        }
        blockExists = await currentBlockData.hasNext()
    }
}

getBaseFeeEstimations()