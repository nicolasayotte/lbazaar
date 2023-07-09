import {
    hexToBytes, 
    Tx, 
    TxWitnesses,
    } from "@hyperionbt/helios";

import { submitTx} from "../common/network.mjs"

/**
 * Main calling function via the command line. 
 * Usage: node submit-tx.mjs walletSignature cborTx
 * @params {string, string}
 * @output {string} txId
 */
const main = async () => {
    try {

        const args = process.argv;
        const cborSig = args[2];
        const cborTx = args[3];
        const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;

        // Reconstruct the helios tx object
        const tx = Tx.fromCbor(hexToBytes(cborTx));

        const outputs = tx.body.outputs.values();
        let adaAmount = BigInt(0);
        for (const output of outputs) {
            console.error("outputs addr: ", output.address.toBech32());
            if (output.address.toBech32() === ownerWalletAddr) {
                adaAmount = output.value.lovelace;
                break;
            }
        }
        if (adaAmount == BigInt(0)) {
            throw console.error("submit-feed-tx: adaAmount not found");
        }
  
        // Add signature from the users wallet
        const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
        tx.addSignatures(signatures);

        const txId = await submitTx(tx);
        const timestamp = new Date().toISOString();
        const returnObj = {
            status: 200,
            txId: txId,
            adaAmount : (adaAmount / BigInt(1_000_000)).toString(),
            date: timestamp
        }
        // Log tx submission success 
        console.error(returnObj);
        process.stdout.write(JSON.stringify(returnObj));

    } catch (err) {
        const timestamp = new Date().toISOString();
        const returnObj = {
            status: 500,
            date: timestamp,
            error: err
        }
        // Log tx submission failure
        console.error(returnObj);
        process.stdout.write(JSON.stringify(returnObj));
    }
}

main();



