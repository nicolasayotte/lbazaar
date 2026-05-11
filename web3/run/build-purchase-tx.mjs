import {
  Address,
  bytesToHex,
  config,
  CoinSelection,
  hexToBytes,
  NetworkParams,
  PubKeyHash,
  Value,
  TxInput,
  TxOutput,
  Tx,
} from '@hyperionbt/helios';

import { signTx } from '../common/sign-tx.mjs';
import { getNetworkParams } from '../common/network.mjs';

// Define time to live for tx validity interval
const ttl = 5;

/**
 * Build unsigned purchase transaction with two outputs (teacher + admin)
 * Usage: node build-purchase-tx.mjs stakeKeyHash hexChangeAddr cborUtxos coursePriceLovelace teacherWalletAddr adminWalletAddr adminCommissionPercent
 * @params {string, string, string, string, string, string, string}
 * @output {string} cborTx
 */
const main = async () => {
  console.error('build-purchase-tx');
  let canPay = false;
  try {
    // Set the Helios compiler optimizer flag
    const network = process.env.NETWORK;
    config.IS_TESTNET = network !== 'mainnet';
    const ownerPkh = process.env.OWNER_PKH;
    const minAda = BigInt(process.env.MIN_ADA);
    const maxTxFee = BigInt(process.env.MAX_TX_FEE);
    const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);

    const args = process.argv;
    const stakeKeyHash = args[2];
    const changeAddrBech32 = args[3];
    const cborUtxos = args[4].split(',');
    const coursePrice = BigInt(args[5]);
    const teacherWalletAddr = args[6];
    const adminWalletAddr = args[7];
    const adminCommissionPercent = parseFloat(args[8]);

    // Calculate payment split
    const adminAmount = BigInt(Math.floor(Number(coursePrice) * (adminCommissionPercent / 100)));
    const teacherAmount = coursePrice - adminAmount;

    const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt + coursePrice);

    // Get the change address from the wallet
    const changeAddr = Address.fromBech32(changeAddrBech32);

    if (stakeKeyHash !== changeAddr.stakingHash.hex) {
      throw console.error('build-purchase-tx.mjs: stake key hash does not match verified stake key');
    }
    console.error('build-purchase-tx.mjs: stake keys match OK');

    // Get UTXOs from wallet (CIP-30 returns full CBOR format)
    const walletUtxos = cborUtxos.map((u) => TxInput.fromFullCbor(hexToBytes(u)));
    const utxos = CoinSelection.selectLargestFirst(walletUtxos, minUTXOVal);
    canPay = true;

    // Start building the transaction
    const tx = new Tx();

    // Add the UTXO as inputs
    tx.addInputs(utxos[0]);

    // Add output to teacher wallet
    tx.addOutput(new TxOutput(Address.fromBech32(teacherWalletAddr), new Value(teacherAmount)));

    // Add output to admin wallet
    tx.addOutput(new TxOutput(Address.fromBech32(adminWalletAddr), new Value(adminAmount)));

    // Set validity interval
    const now = new Date();
    const before = new Date(now.getTime());
    before.setMinutes(now.getMinutes() - ttl);
    const after = new Date(now.getTime());
    after.setMinutes(now.getMinutes() + ttl);

    // Set metadata message
    tx.addMetadata(
      674,
      JSON.stringify({ msg: `Course purchase: ${(coursePrice / BigInt(1_000_000)).toString()} ADA for ${stakeKeyHash}`.match(/(.{1,64})/g) }),
    );

    // Set a valid time interval
    tx.validFrom(before);
    tx.validTo(after);

    // Add owner pkh as a signer
    tx.addSigner(PubKeyHash.fromHex(ownerPkh));

    // Also add the user wallet as signer
    tx.addSigner(changeAddr.pubKeyHash);

    // Network Params
    const networkParamsPreview = await getNetworkParams(network);
    const networkParams = new NetworkParams(JSON.parse(networkParamsPreview));

    // Send any change back to the buyer
    await tx.finalize(networkParams, changeAddr, utxos[1]);

    // Add the signature from the server side private key
    const txSigned = await signTx(tx);

    const returnObj = {
      status: 200,
      cborTx: bytesToHex(txSigned.toCbor()),
      teacherAmount: teacherAmount.toString(),
      adminAmount: adminAmount.toString(),
      totalAmount: coursePrice.toString(),
    };
    console.error('build-purchase-tx: returnObj: ', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const timestamp = new Date().toISOString();
    const returnObj = {
      status: canPay ? 500 : 501,
      date: timestamp,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error('build-purchase-tx: returnObj: ', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
