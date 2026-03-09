import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import {
  Address,
  Assets,
  MintingPolicyHash,
  TxInput,
  TxOutput,
  TxOutputId,
  Value,
  bytesToHex,
  hexToBytes,
} from '@hyperionbt/helios';

export { fetchUtxos };

const apiKey = process.env.BLOCKFROST_API_KEY;

let _client;
const getClient = () => {
  if (!_client) {
    _client = new BlockFrostAPI({ projectId: apiKey });
  }
  return _client;
};

/**
 * Convert a Blockfrost UTXO amount array to a Helios Value.
 * Blockfrost format: [{unit: "lovelace", quantity: "5000000"}, {unit: "<policyId><assetHex>", quantity: "1"}]
 */
function blockfrostAmountToValue(amount) {
  let lovelace = BigInt(0);
  const assetMap = new Map(); // policyHex -> Map<tokenNameBytes, quantity>

  for (const entry of amount) {
    if (entry.unit === 'lovelace') {
      lovelace = BigInt(entry.quantity);
    } else {
      // Native token: unit = policyId (56 hex) + assetNameHex
      const policyHex = entry.unit.substring(0, 56);
      const assetHex = entry.unit.substring(56);

      if (!assetMap.has(policyHex)) {
        assetMap.set(policyHex, []);
      }
      assetMap.get(policyHex).push([hexToBytes(assetHex), BigInt(entry.quantity)]);
    }
  }

  if (assetMap.size === 0) {
    return new Value(lovelace);
  }

  const assetsArray = [];
  for (const [policyHex, tokens] of assetMap) {
    assetsArray.push([MintingPolicyHash.fromHex(policyHex), tokens]);
  }

  return new Value(lovelace, new Assets(assetsArray));
}

/**
 * Fetch UTXOs for an address from Blockfrost and return as Helios TxInput CBOR hex strings.
 * @param {string} bech32Address - Cardano bech32 address
 * @returns {Promise<string[]>} Array of hex-encoded full CBOR TxInput
 */
async function fetchUtxos(bech32Address) {
  const utxos = await getClient().addressesUtxos(bech32Address);

  if (!utxos || utxos.length === 0) {
    throw new Error('No UTXOs found for address: ' + bech32Address.substring(0, 20) + '...');
  }

  const addr = Address.fromBech32(bech32Address);

  return utxos.map((utxo) => {
    const value = blockfrostAmountToValue(utxo.amount);
    const output = new TxOutput(addr, value);
    const outputId = new TxOutputId(utxo.tx_hash + '#' + utxo.output_index);
    const input = new TxInput(outputId, output);
    return bytesToHex(input.toFullCbor());
  });
}

/**
 * CLI entry point: node get-owner-utxos.mjs [address]
 * If no address given, uses OWNER_WALLET_ADDR from env.
 */
const main = async () => {
  try {
    const address = process.argv[2] || process.env.OWNER_WALLET_ADDR;

    if (!address) {
      throw new Error('No address provided and OWNER_WALLET_ADDR not set');
    }

    const cborUtxos = await fetchUtxos(address);

    const returnObj = {
      status: 200,
      utxos: cborUtxos,
      count: cborUtxos.length,
    };

    console.error('get-owner-utxos: success, found', cborUtxos.length, 'UTXOs for', address.substring(0, 20) + '...');
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const returnObj = {
      status: 500,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error('get-owner-utxos: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

// Run as CLI if executed directly
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));
if (isMain) {
  main();
}
