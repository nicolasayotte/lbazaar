import { describe, it, expect } from 'vitest';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY || '';
const isPlaceholder =
    ['blockfrost.io key', 'test-blockfrost-key', 'goes here'].some((p) =>
        apiKey.toLowerCase().includes(p)
    ) || apiKey.length < 10;

describe.skipIf(isPlaceholder)('check-network-health diagnosis', () => {
    const api = new BlockFrostAPI({ projectId: apiKey });

    it(
        'logs raw latestBlock.time and computed block age',
        async () => {
            const latestBlock = await api.blocksLatest();
            const nowSecs = Math.floor(Date.now() / 1000);
            const blockAgeSecs = nowSecs - latestBlock.time;

            console.log('latestBlock.time (raw):', latestBlock.time);
            console.log('Date.now()/1000 (now): ', nowSecs);
            console.log('block age (seconds):   ', blockAgeSecs);
            console.log('block age (minutes):   ', (blockAgeSecs / 60).toFixed(1));
            console.log('block height:          ', latestBlock.height);
            console.log('block hash:            ', latestBlock.hash);

            // Just assert we got a valid block — not a health judgement
            expect(latestBlock.time).toBeGreaterThan(0);
        },
        15_000
    );
});
