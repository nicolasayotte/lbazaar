import { hexToBytes, Tx, TxWitnesses } from '@hyperionbt/helios';

import { submitTx } from '../common/network.mjs';

/**
 * Submit signed purchase transaction to Cardano blockchain.
 * Usage: node submit-purchase-tx.mjs cborSig cborTx teacherWalletAddr adminWalletAddr
 * @params {string, string, string, string}
 * @output {string} txId
 */
const main = async () => {
  try {
    const args = process.argv;
    const cborSig = args[2];
    const cborTx = args[3];
    const teacherWalletAddr = args[4];
    const adminWalletAddr = args[5];

    // Reconstruct the helios tx object
    const tx = Tx.fromCbor(hexToBytes(cborTx));

    const outputs = tx.body.outputs.values();
    let teacherAmount = BigInt(0);
    let adminAmount = BigInt(0);
    for (const output of outputs) {
      console.error('outputs addr: ', output.address.toBech32());
      if (output.address.toBech32() === teacherWalletAddr) {
        teacherAmount = output.value.lovelace;
      } else if (output.address.toBech32() === adminWalletAddr) {
        adminAmount = output.value.lovelace;
      }
    }
    if (teacherAmount == BigInt(0)) {
      throw console.error('submit-purchase-tx: teacher payment not found in transaction outputs');
    }
    if (adminAmount == BigInt(0)) {
      throw console.error('submit-purchase-tx: admin payment not found in transaction outputs');
    }

    // Add signature from the users wallet
    const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
    tx.addSignatures(signatures);

    const txId = await submitTx(tx);
    const timestamp = new Date().toISOString();
    const returnObj = {
      status: 200,
      txId: txId,
      teacherAmount: (teacherAmount / BigInt(1_000_000)).toString(),
      adminAmount: (adminAmount / BigInt(1_000_000)).toString(),
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
    // Log tx submission failure
    console.error(returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
