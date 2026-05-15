import {
  Address,
  config,
  CoinSelection,
  hexToBytes,
  NetworkParams,
  Value,
  TxOutput,
  TxOutputId,
  Tx,
  UTxO,
} from '@hyperionbt/helios';

import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { getAccountAddr, signTx, submitTx } from '../common/sign-tx.mjs';
import { getNetworkParams } from '../common/network.mjs';
import { toHeliosMetadata } from '../common/certificate-metadata.mjs';

/**
 * Build, sign and submit a plain ADA refund transaction from the platform wallet
 * to the student's wallet.
 *
 * Usage: node build-refund-tx.mjs recipientAddress adaAmount
 *   recipientAddress  - bech32 address of the student
 *   adaAmount         - amount to refund in ADA units (not lovelace)
 *
 * Output (stdout): { status: 200, txId: "..." }
 *             or   { status: 500, error: "..." }
 */
const main = async () => {
  console.error('build-refund-tx');
  try {
    const network = process.env.NETWORK;
    config.IS_TESTNET = network !== 'mainnet';

    const apiKey = process.env.BLOCKFROST_API_KEY;
    const maxTxFee = BigInt(process.env.MAX_TX_FEE);
    const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);

    const args = process.argv;
    const recipientAddress = args[2];
    const adaAmountAda = parseFloat(args[3]);

    if (!recipientAddress) {
      throw new Error('recipientAddress is required');
    }
    if (!adaAmountAda || adaAmountAda <= 0) {
      throw new Error('adaAmount must be greater than zero');
    }

    const adaAmountLovelace = BigInt(Math.round(adaAmountAda * 1_000_000));

    // Derive the platform wallet address (account 0 = server key)
    const platformAddrBech32 = await getAccountAddr(0);
    const platformAddr = Address.fromBech32(platformAddrBech32);

    // Fetch platform UTXOs from Blockfrost
    const api = new BlockFrostAPI({ projectId: apiKey });
    const rawUtxos = await api.addressesUtxos(platformAddrBech32);

    if (!rawUtxos || rawUtxos.length === 0) {
      throw new Error('No UTXOs available in platform wallet');
    }

    // Fetch CBOR for each UTXO and build Helios UTxO objects
    const heliosUtxos = await Promise.all(
      rawUtxos.map(async (u) => {
        const txCbor = await api.txsCbor(u.tx_hash);
        // Parse the full transaction CBOR and extract the specific output
        const fullTx = Tx.fromCbor(hexToBytes(txCbor.cbor));
        const output = fullTx.body.outputs[u.output_index];
        if (!output) {
          throw new Error(`Output index ${u.output_index} not found in tx ${u.tx_hash}`);
        }
        return new UTxO(new TxOutputId(`${u.tx_hash}#${u.output_index}`), output);
      }),
    );

    // Select UTXOs: need enough to cover refund amount + fee + change
    const minRequired = new Value(adaAmountLovelace + maxTxFee + minChangeAmt);
    const [selectedInputs, remainingUtxos] = CoinSelection.selectLargestFirst(
      heliosUtxos,
      minRequired,
    );

    // Build the transaction
    const tx = new Tx();
    tx.addInputs(selectedInputs);

    // Add recipient output
    tx.addOutput(new TxOutput(Address.fromBech32(recipientAddress), new Value(adaAmountLovelace)));

    // Set validity window (10 minutes either side)
    const ttl = 10;
    const now = new Date();
    const before = new Date(now.getTime());
    before.setMinutes(now.getMinutes() - ttl);
    const after = new Date(now.getTime());
    after.setMinutes(now.getMinutes() + ttl);
    tx.validFrom(before);
    tx.validTo(after);

    // Attach refund metadata
    tx.addMetadata(674, toHeliosMetadata({
      msg: [`ADA refund ${args[3]} ADA`.substring(0, 64)],
    }));

    // Finalize: change returns to platform wallet
    const networkParamsRaw = await getNetworkParams(network);
    const networkParams = new NetworkParams(JSON.parse(networkParamsRaw));
    await tx.finalize(networkParams, platformAddr, remainingUtxos);

    // Sign with platform key and submit
    const txSigned = await signTx(tx, 0);
    const txId = await submitTx(txSigned);

    const returnObj = { status: 200, txId };
    console.error('build-refund-tx: success', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const returnObj = {
      status: 500,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error('build-refund-tx: error', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
