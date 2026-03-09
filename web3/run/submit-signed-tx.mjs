import { hexToBytes, Tx, TxWitnesses } from '@hyperionbt/helios';
import { submitTx } from '../common/sign-tx.mjs';

/**
 * Generic: merge a CIP-30 wallet witness set into an already-signed tx and submit.
 * Usage: node submit-signed-tx.mjs cborSig cborTx
 * @output {string} JSON { status, txId } or { status, error }
 */
const main = async () => {
  try {
    const cborSig = process.argv[2];
    const cborTx = process.argv[3];

    if (!cborSig || !cborTx) {
      throw new Error('Missing required arguments: cborSig cborTx');
    }

    // Reconstruct the tx from CBOR (already has owner signature)
    const tx = Tx.fromCbor(hexToBytes(cborTx));

    // Extract the student's signatures from the CIP-30 witness set
    const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
    tx.addSignatures(signatures);

    // Submit to blockchain via Blockfrost
    const txId = await submitTx(tx);

    const returnObj = { status: 200, txId };
    console.error('submit-signed-tx: success', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const returnObj = {
      status: 500,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error('submit-signed-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
