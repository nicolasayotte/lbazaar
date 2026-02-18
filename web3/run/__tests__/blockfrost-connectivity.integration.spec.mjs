import { describe, it, expect } from 'vitest';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY || '';
const isPlaceholder =
    ['blockfrost.io key', 'test-blockfrost-key', 'goes here'].some((p) =>
        apiKey.toLowerCase().includes(p)
    ) || apiKey.length < 10;

describe.skipIf(isPlaceholder)('Blockfrost Preprod Connectivity', () => {
    const api = new BlockFrostAPI({ projectId: apiKey });

    it(
        'health endpoint returns is_healthy: true',
        async () => {
            const health = await api.health();
            expect(health.is_healthy).toBe(true);
        },
        15_000
    );

    it(
        'latest epoch data is valid',
        async () => {
            const epoch = await api.epochsLatest();
            expect(epoch.epoch).toBeGreaterThan(0);
            expect(epoch.start_time).toBeGreaterThan(0);
        },
        15_000
    );

    it(
        'genesis parameters confirm preprod network',
        async () => {
            const genesis = await api.genesis();
            // preprod network_magic is 1; mainnet is 764824073
            expect(genesis.network_magic).toBe(1);
        },
        15_000
    );
});
