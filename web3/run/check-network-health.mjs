import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const DEGRADED_BLOCK_AGE_SECONDS = 300;

const main = async () => {
    try {
        const API = new BlockFrostAPI({ projectId: process.env.BLOCKFROST_API_KEY });
        const health = await API.health();

        if (!health.is_healthy) {
            process.stdout.write(JSON.stringify({ status: 200, networkStatus: 'unreachable', latestBlock: null }));
            return;
        }

        const latestBlock = await API.blocksLatest();
        const blockAgeSecs = Math.floor(Date.now() / 1000) - latestBlock.time;
        const networkStatus = blockAgeSecs > DEGRADED_BLOCK_AGE_SECONDS ? 'degraded' : 'healthy';

        console.error('check-network-health: status=' + networkStatus + ' blockAge=' + blockAgeSecs + 's');
        process.stdout.write(JSON.stringify({
            status: 200,
            networkStatus,
            latestBlock: { hash: latestBlock.hash, height: latestBlock.height, time: new Date(latestBlock.time * 1000).toISOString() },
        }));
    } catch (err) {
        console.error('check-network-health: error', err.message);
        process.stdout.write(JSON.stringify({ status: 500, error: err.message }));
    }
};

main();
