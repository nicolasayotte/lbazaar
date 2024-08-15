import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { promises as fs } from 'fs';
import { Tx } from '@hyperionbt/helios';

export { getNetworkParams, submitTx };

async function getNetworkParams(network) {
  // Network Parameters
  var networkParamsFile;
  if (network === 'preview') {
    networkParamsFile = 'preview.json';
  } else if (network === 'preprod') {
    networkParamsFile = 'preprod.json';
  } else if (network === 'mainnet') {
    networkParamsFile = 'mainnet.json';
  } else {
    throw console.error('getNetworkParams: network not set');
  }
  const networkParams = await fs.readFile('./config/' + networkParamsFile, 'utf8');
  return networkParams.toString();
}

/**
 * Submit a Helios Tx to blockfrost and return the
 * txId if successful.
 * @param {Tx} tx
 * @returns {string} txId
 */

const submitTx = async (tx) => {
  const payload = new Uint8Array(tx.toCbor());

  try {
    const client = new BlockFrostAPI({
      projectId: process.env.BLOCKFROST_API_KEY,
    });

    const txHash = await client.txSubmit(payload);
    return txHash;
  } catch (err) {
    throw err;
  }
};
