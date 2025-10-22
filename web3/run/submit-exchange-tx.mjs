import { hexToBytes, MintingPolicyHash, textToBytes, Tx, TxWitnesses } from '@hyperionbt/helios';

import { submitTx } from '../common/network.mjs';

/**
 * Main calling function via the command line.
 * Usage: node submit-tx.mjs nftName walletSignature cborTx
 * @params {string, string, string}
 * @output {string} txId
 */
const main = async () => {
  try {
    const args = process.argv;
    console.error('submit-exchange-tx: args: ', args);
    const nftName = args[2];
    const serialNum = args[3];
    const mphHex = args[4];
    const cborSig = args[5];
    const cborTx = args[6];

    // Reconstruct the helios tx object
    const tx = Tx.fromCbor(hexToBytes(cborTx));

    const tn = '(222)' + nftName + '|' + serialNum;
    const tokenName = textToBytes(tn);
    const mph = MintingPolicyHash.fromHex(mphHex);
    if (!tx.body.minted.has(mph, tokenName)) {
      throw console.error('submit-exchange-tx: NFT name or mph not found in tx');
    }

    // Add signature from the users wallet
    const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
    tx.addSignatures(signatures);

    const txId = await submitTx(tx);
    const timestamp = new Date().toISOString();
    const returnObj = {
      status: 200,
      txId: txId,
      date: timestamp,
    };
    // Log tx submission success
    console.error(returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const timestamp = new Date().toISOString();
    const returnObj = {
      status: 500,
      date: timestamp,
      error: err,
    };
    console.error(returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
