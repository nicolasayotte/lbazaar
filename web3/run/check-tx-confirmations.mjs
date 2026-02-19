import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

/**
 * Check how many block confirmations a Cardano transaction has.
 * Usage: node check-tx-confirmations.mjs <txId>
 * @params {string} txId
 * @output {string} JSON with confirmations, txBlockHeight, tipHeight
 */
const main = async () => {
  const args = process.argv;
  const txId = args[2];

  if (!txId) {
    process.stdout.write(JSON.stringify({ status: 400, error: 'txId argument required' }));
    process.exit(1);
  }

  const apiKey = process.env.BLOCKFROST_API_KEY;

  const API = new BlockFrostAPI({
    projectId: apiKey,
  });

  try {
    const tx = await API.txs(txId);
    const txBlockHeight = tx.block_height;

    const latestBlock = await API.blocksLatest();
    const tipHeight = latestBlock.height;

    const confirmations = tipHeight - txBlockHeight;

    const returnObj = {
      status: 200,
      confirmations,
      txBlockHeight,
      tipHeight,
    };
    console.error('check-tx-confirmations: returnObj: ', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
    process.exit(0);
  } catch (err) {
    const timestamp = new Date().toISOString();

    if (err && err.status_code === 404) {
      const returnObj = {
        status: 404,
        error: 'Transaction not found',
      };
      console.error(timestamp, 'check-tx-confirmations: 404', txId);
      process.stdout.write(JSON.stringify(returnObj));
      process.exit(1);
    }

    const returnObj = {
      status: 500,
      error: err instanceof Error ? err.message : String(err),
    };
    console.error(timestamp, 'check-tx-confirmations: error', err);
    process.stdout.write(JSON.stringify(returnObj));
    process.exit(1);
  }
};

main();
