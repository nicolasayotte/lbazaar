import {
    Address, 
    bytesToHex, 
    CoinSelection,
    hexToBytes, 
    NetworkParams,
    Value, 
    Tx, 
    UTxO 
} from "@hyperionbt/helios";

import { getNetworkParams } from "../common/network.mjs"

/**
 * Main calling function via the command line 
 * Usage: node build-wallet-hw-tx.js cBorChangeAddr
 * @params {string}
 * @output {string, string} cborTx cborTxBody
 */
const main = async () => {

    console.error("build-wallet-hw-tx");
    try {

        const network = process.env.NETWORK;
        const args = process.argv;
        const hexAddr = args[2];
        const cborUtxos = args[3].split(',');
        const minAda = BigInt(process.env.MIN_ADA);  // minimum lovelace needed to send an NFT
        const maxTxFee = BigInt(process.env.MAX_TX_FEE);
        const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);
        const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt);
           
        // Get the address from the wallet
        const addr = Address.fromHex(hexAddr);

        // Get UTXOs from wallet
        const walletUtxos = cborUtxos.map(u => UTxO.fromCbor(hexToBytes(u)));
        const utxos = CoinSelection.selectSmallestFirst(walletUtxos, minUTXOVal);


        // Start building the transaction
        const tx = new Tx();

        // Add the UTXO as inputs
        tx.addInputs(utxos[0]);

        tx.addSigner(addr.pubKeyHash);
        tx.addSigner(addr.stakingHash); 

        const networkParamsFile = await getNetworkParams(network);
        const networkParams = new NetworkParams(JSON.parse(networkParamsFile));
        
        await tx.finalize(networkParams, addr, utxos[1]);

        const returnObj = {
            status: 200,
            cborTx: bytesToHex(tx.toCbor())
        }
        console.error("build-hw-wallet-tx: returnObj: ", returnObj);
        process.stdout.write(JSON.stringify(returnObj));

    } catch (err) {
        const timestamp = new Date().toISOString();
        const returnObj = {
            status: 500,
            date: timestamp,
            error: err
        }
        console.error("build-hw-wallet-tx: returnObj: ", returnObj);
        process.stdout.write(JSON.stringify(returnObj));
    }
}

main();


  