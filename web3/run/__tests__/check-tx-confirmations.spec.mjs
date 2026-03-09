import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockTxs = vi.fn();
const mockBlocksLatest = vi.fn();

const mockBlockFrostAPI = vi.fn(() => ({
  txs: mockTxs,
  blocksLatest: mockBlocksLatest,
}));

vi.mock('@blockfrost/blockfrost-js', () => ({
  BlockFrostAPI: mockBlockFrostAPI,
}));

describe('check-tx-confirmations.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  let mockProcessExit;
  let mockStdoutWrite;
  let mockConsoleError;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env = {
      ...originalEnv,
      BLOCKFROST_API_KEY: 'test-api-key',
    };

    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    mockProcessExit.mockRestore();
    mockStdoutWrite.mockRestore();
    mockConsoleError.mockRestore();
    vi.resetModules();
  });

  describe('Argument Validation', () => {
    it('returns status 400 when txId argument is missing', async () => {
      process.argv = ['node', 'check-tx-confirmations.mjs'];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      // The script writes the error response then calls process.exit(1).
      // Because process.exit is mocked as a no-op, execution continues into
      // the BlockFrostAPI instantiation path; the first write is the one under test.
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(400);
      expect(response.error).toBe('txId argument required');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Successful Confirmation Check', () => {
    it('returns status 200 with confirmations, txBlockHeight, and tipHeight', async () => {
      const txId = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123';

      mockTxs.mockResolvedValueOnce({ block_height: 990 });
      mockBlocksLatest.mockResolvedValueOnce({ height: 1000 });

      process.argv = ['node', 'check-tx-confirmations.mjs', txId];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('confirmations');
      expect(response).toHaveProperty('txBlockHeight');
      expect(response).toHaveProperty('tipHeight');
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });

    it('calculates confirmations as tipHeight minus txBlockHeight', async () => {
      const txId = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123';
      const txBlockHeight = 990;
      const tipHeight = 1000;

      mockTxs.mockResolvedValueOnce({ block_height: txBlockHeight });
      mockBlocksLatest.mockResolvedValueOnce({ height: tipHeight });

      process.argv = ['node', 'check-tx-confirmations.mjs', txId];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response.confirmations).toBe(10);
      expect(response.txBlockHeight).toBe(txBlockHeight);
      expect(response.tipHeight).toBe(tipHeight);
      expect(mockProcessExit).toHaveBeenCalledWith(0);
    });
  });

  describe('Transaction Not Found', () => {
    it('returns status 404 when Blockfrost reports the transaction does not exist', async () => {
      const txId = 'nonexistent-tx-id';
      const notFoundError = Object.assign(new Error('Not found'), { status_code: 404 });

      mockTxs.mockRejectedValueOnce(notFoundError);

      process.argv = ['node', 'check-tx-confirmations.mjs', txId];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      // The 404 branch calls process.exit(1) which is mocked as a no-op, so execution
      // falls through to the generic 500 handler which also writes to stdout.
      // The first write is the 404 response under test.
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(404);
      expect(response.error).toBe('Transaction not found');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Blockfrost API Error', () => {
    it('returns status 500 with error message on unexpected API failure', async () => {
      const txId = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123';
      const apiError = new Error('Internal server error');

      mockTxs.mockRejectedValueOnce(apiError);

      process.argv = ['node', 'check-tx-confirmations.mjs', txId];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalledTimes(1);
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response.error).toBe('Internal server error');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });

    it('converts non-Error thrown values to string in the error field', async () => {
      const txId = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123';

      mockTxs.mockRejectedValueOnce('plain string error');

      process.argv = ['node', 'check-tx-confirmations.mjs', txId];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response.error).toBe('plain string error');
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('BlockFrostAPI Instantiation', () => {
    it('initialises BlockFrostAPI with the BLOCKFROST_API_KEY env variable', async () => {
      const txId = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123';

      mockTxs.mockResolvedValueOnce({ block_height: 100 });
      mockBlocksLatest.mockResolvedValueOnce({ height: 105 });

      process.env = { ...originalEnv, BLOCKFROST_API_KEY: 'my-project-key' };
      process.argv = ['node', 'check-tx-confirmations.mjs', txId];

      await import('../check-tx-confirmations.mjs?t=' + Date.now());

      expect(mockBlockFrostAPI).toHaveBeenCalledWith({ projectId: 'my-project-key' });
    });
  });
});
