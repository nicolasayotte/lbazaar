import { hexToBytes, Tx } from '@hyperionbt/helios';
import { signTx, submitTx } from '../common/sign-tx.mjs';

/**
 * Main function to submit certificate minting transaction
 * Usage: node submit-certificate-tx.mjs cborTx
 * @params {string}
 * @output {string} txId
 */
const main = async () => {
  try {
    const args = process.argv;
    const cborTx = args[2];

    if (!cborTx) {
      throw new Error('Missing cborTx parameter');
    }

    // Reconstruct the transaction from CBOR
    const tx = Tx.fromCbor(hexToBytes(cborTx));

    // Sign the transaction with the owner's key
    const signedTx = await signTx(tx, 0); // Use account ID 0 for owner

    // Submit the transaction
    const txId = await submitTx(signedTx);

    const returnObj = {
      status: 200,
      txId: txId,
      date: new Date().toISOString()
    };

    console.error('submit-certificate-tx: success', returnObj);
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err,
      date: new Date().toISOString()
    };
    console.error('submit-certificate-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
