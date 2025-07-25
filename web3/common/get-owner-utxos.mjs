import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY;
const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;

/**
 * Get UTXOs for the owner wallet
 * @output {string} JSON response with UTXOs
 */
const main = async () => {
  try {
    const API = new BlockFrostAPI({
      projectId: apiKey,
    });

    const utxos = await API.addressesUtxos(ownerWalletAddr);
    
    if (!utxos || utxos.length === 0) {
      throw new Error('No UTXOs found in owner wallet');
    }

    // Convert to CBOR format (simplified - you may need to adapt based on actual UTXO structure)
    const cborUtxos = utxos.map(utxo => {
      // This is a placeholder - actual implementation would need proper UTXO to CBOR conversion
      // based on the Blockfrost UTXO structure
      return utxo.tx_hash + '#' + utxo.output_index;
    });

    const returnObj = {
      status: 200,
      utxos: cborUtxos,
      count: cborUtxos.length
    };

    console.error('get-owner-utxos: success, found', cborUtxos.length, 'UTXOs');
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err
    };
    console.error('get-owner-utxos: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
