import {
    Address,  
    bytesToHex, 
    CoinSelection,
    hexToBytes, 
    NetworkParams,
    PubKeyHash,
    Value, 
    TxOutput,
    Tx, 
    UTxO 
} from "@hyperionbt/helios";

import { signTx } from "../common/sign-tx.mjs";
import { getNetworkParams } from "../common/network.mjs"

// Define time to live for tx validity interval
const ttl = 5; 

/**
 * Main calling function via the command line 
 * Usage: node build-feed-tx.js cBorChangeAddr [cborUtxo1,cborUtxo2,...] adaAmount
 * @params {string, string, string[], string}
 * @output {string} cborTx
 */
const main = async () => {

    console.error("build-feed-tx");
    try {
        // Set the Helios compiler optimizer flag
        const network = process.env.NETWORK;
        const ownerPkh = process.env.OWNER_PKH;
        const minAda = BigInt(process.env.MIN_ADA);  // minimum lovelace needed to send an NFT
        const maxTxFee = BigInt(process.env.MAX_TX_FEE);
        const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);
        const args = process.argv;
        const stakeKeyHash = args[2]
        const hexChangeAddr = args[3];
        const cborUtxos = args[4].split(',');
        const adaAmount = BigInt(args[5]) * BigInt(1_000_000);
        const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt + adaAmount);
        const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;
  
        // Get the change address from the wallet
        const changeAddr = Address.fromHex(hexChangeAddr);

        if (!(stakeKeyHash === changeAddr.stakingHash.hex)) {
            throw console.error("build-feed-tx.mjs: stake key hash does not match verified stake key");
        }
        console.error("build-feed-tx.mjs: stake keys match OK")

        // Get UTXOs from wallet
        const walletUtxos = cborUtxos.map(u => UTxO.fromCbor(hexToBytes(u)));
        const utxos = CoinSelection.selectSmallestFirst(walletUtxos, minUTXOVal);

        // Start building the transaction
        const tx = new Tx();

        // Add the UTXO as inputs
        tx.addInputs(utxos[0]);

       tx.addOutput(new TxOutput(
            Address.fromBech32(ownerWalletAddr),
            new Value(adaAmount)
          ));

        // Set validitity interval
        const now = new Date();
        const before = new Date(now.getTime());
        before.setMinutes(now.getMinutes() - ttl);
        const after = new Date(now.getTime());
        after.setMinutes(now.getMinutes() + ttl);
        
        // Set a valid time interval
        tx.validFrom(before);
        tx.validTo(after);

        // Add owner pkh as a signer which is required to mint the nft
        tx.addSigner(PubKeyHash.fromHex(ownerPkh));

        // Also add the user wallet as signer as well
        tx.addSigner(changeAddr.pubKeyHash);

        // Network Params
        const networkParamsPreview = await getNetworkParams(network);
        const networkParams = new NetworkParams(JSON.parse(networkParamsPreview));
        
        // Send any change back to the buyer
        await tx.finalize(networkParams, changeAddr, utxos[1]);

        // Add the signature from the server side private key
        // This way, we lock the transaction now and then need
        // the end user to sign the tx.
        const txSigned = await signTx(tx);

        const returnObj = {
            status: 200,
            cborTx: bytesToHex(txSigned.toCbor())
        }
        console.error("build-feed-tx: returnObj: ", returnObj);
        process.stdout.write(JSON.stringify(returnObj));

    } catch (err) {
        const timestamp = new Date().toISOString();
        const returnObj = {
            status: 500,
            date: timestamp,
            error: err
        }
        console.error("build-feed-tx: returnObj: ", returnObj);
        process.stdout.write(JSON.stringify(returnObj));
    }
}

main();


  