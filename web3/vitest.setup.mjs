import { afterEach } from 'vitest';

// Ensure environment variables required by modules have sensible defaults during tests.
process.env.OWNER_PKH = process.env.OWNER_PKH || 'owner-pkh-test';
process.env.NMKR_PKH = process.env.NMKR_PKH || '';
process.env.NETWORK = process.env.NETWORK || 'preprod';
process.env.MIN_ADA = process.env.MIN_ADA || '2000000';
process.env.MAX_TX_FEE = process.env.MAX_TX_FEE || '500000';
process.env.MIN_CHANGE_AMT = process.env.MIN_CHANGE_AMT || '1000000';
process.env.TTL_MINUTES = process.env.TTL_MINUTES || '30';
process.env.BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || 'test-blockfrost-key';
process.env.OWNER_WALLET_ADDR = process.env.OWNER_WALLET_ADDR || 'addr_test1ownerwallet';

// Reset globals between tests to avoid cross-test pollution from mocks.
afterEach(() => {
  delete globalThis.getParamsFile;
});
