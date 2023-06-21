import axios from 'axios';
import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import { promises as fs } from 'fs';

import { Address,
         bytesToHex,
         MintingPolicyHash,
         Tx,
         UTxO, 
         } from "@hyperionbt/helios";


export {
    getNetworkParams,
    submitTx
}

async function getNetworkParams(network) {

    // Network Parameters
    var networkParamsFile;
    if (network === "preview") {
        networkParamsFile = "preview.json";
    } else if (network === "preprod") {
        networkParamsFile = "preprod.json";
    } else if (network === "mainnet") {
        networkParamsFile = "mainnet.json";
    } else {
        throw console.error("getNetworkParams: network not set");
    }
    const networkParams = await fs.readFile('./config/' + networkParamsFile, 'utf8');
    return networkParams.toString();

    /*
    var networkParamsUrl;
    if (network === "preview") {
        networkParamsUrl = "https://d1t0d7c2nekuk0.cloudfront.net/preview.json";
    } else if (network === "preprod") {
        networkParamsUrl = "https://d1t0d7c2nekuk0.cloudfront.net/preprod.json";
    } else if (network === "mainnet") {
        networkParamsUrl = "https://d1t0d7c2nekuk0.cloudfront.net/mainnet.json";
    } else {
        throw console.error("getNetworkParams: network not set");
    }

    try {
       let res = await axios({
            url: networkParamsUrl,
            method: 'get',
            timeout: 8000,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        if(res.status == 200){
            return res.data;
        } else {
          throw console.error("getNetworkParams: error getting network params: ", res);
        }   
    }
    catch (err) {
        throw console.error("getNetworkParams: error getting network params: ", err);
    }
    */
}

/**
 * Submit a Helios Tx to blockfrost and return the
 * txId if successful.
 * @param {Tx} tx
 * @returns {string} txId
 */

//const blockfrostAPI = process.env.BLOCKFROST_API;

const submitTx = async (tx) => {

    const payload = new Uint8Array(tx.toCbor());
    //const blockfrostUrl = blockfrostAPI + "/tx/submit";
    //const apiKey = process.env.BLOCKFROST_API_KEY;

    try {
        const client = new BlockFrostAPI({
            projectId: process.env.BLOCKFROST_API_KEY,
          });

        /*  
        let res = await axios({
            url: blockfrostUrl,
            data: payload,
            method: 'post',
            timeout: 30000,
            headers: {
                'Content-Type': 'application/cbor',
                'project_id': apiKey
            }
        })

        */
        const txHash = await client.txSubmit(payload);
        return txHash;
        //if(res.status == 200){
        //    return res.data;
        //} else {
        //    throw res.data;
        //}   
    }
    catch (err) {
        throw err;
    }
}
  