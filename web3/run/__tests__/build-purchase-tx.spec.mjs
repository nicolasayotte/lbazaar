import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Helios library
const mockTx = {
  addInputs: vi.fn().mockReturnThis(),
  addOutput: vi.fn().mockReturnThis(),
  validFrom: vi.fn().mockReturnThis(),
  validTo: vi.fn().mockReturnThis(),
  addSigner: vi.fn().mockReturnThis(),
  addMetadata: vi.fn().mockReturnThis(),
  finalize: vi.fn().mockResolvedValue(undefined),
  toCbor: vi.fn(() => new Uint8Array([0x84, 0xa4, 0x00, 0x81]))
};

const mockAddress = {
  fromHex: vi.fn(() => ({
    stakingHash: { hex: 'test-stake-hash' },
    pubKeyHash: 'test-pub-key-hash'
  })),
  fromBech32: vi.fn((addr) => ({
    stakingHash: { hex: 'test-stake-hash' },
    pubKeyHash: 'test-pub-key-hash',
    toBech32: () => addr
  }))
};

const mockTxInput = {
  fromFullCbor: vi.fn(() => ({
    txHash: 'test-tx-hash',
    outputIndex: 0,
    value: { lovelace: 100000000n }
  }))
};

const mockCoinSelection = {
  selectLargestFirst: vi.fn(() => [
    [{ txHash: 'test-tx-hash', outputIndex: 0 }], // Selected UTXOs
    [] // Remaining UTXOs
  ])
};

const mockValue = vi.fn(function(amount) {
  return { lovelace: amount };
});

const mockTxOutput = vi.fn(function(address, value) {
  return { address, value };
});

const mockPubKeyHash = {
  fromHex: vi.fn(() => 'mock-pub-key-hash')
};

const mockNetworkParams = vi.fn(function(params) {
  return { params };
});

vi.mock('@hyperionbt/helios', () => ({
  Address: mockAddress,
  bytesToHex: vi.fn((bytes) => 'mock-hex-tx'),
  config: { IS_TESTNET: true },
  CoinSelection: mockCoinSelection,
  hexToBytes: vi.fn((hex) => new Uint8Array([0x00])),
  NetworkParams: mockNetworkParams,
  PubKeyHash: mockPubKeyHash,
  Value: mockValue,
  TxInput: mockTxInput,
  TxOutput: mockTxOutput,
  Tx: vi.fn(() => mockTx),
}));

const mockSignTx = vi.fn((tx) => ({
  ...tx,
  toCbor: () => new Uint8Array([0x84, 0xa4, 0x00, 0x81])
}));

const mockGetNetworkParams = vi.fn(async () => JSON.stringify({
  protocolParams: { minFeeA: 44, minFeeB: 155381 }
}));

vi.mock('../../common/sign-tx.mjs', () => ({
  signTx: mockSignTx
}));

vi.mock('../../common/network.mjs', () => ({
  getNetworkParams: mockGetNetworkParams
}));

describe('build-purchase-tx.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockTx.addInputs.mockReturnThis();
    mockTx.addOutput.mockReturnThis();
    mockTx.validFrom.mockReturnThis();
    mockTx.validTo.mockReturnThis();
    mockTx.addSigner.mockReturnThis();
    mockTx.addMetadata.mockReturnThis();
    mockTx.finalize.mockResolvedValue(undefined);
    mockTx.toCbor.mockReturnValue(new Uint8Array([0x84, 0xa4, 0x00, 0x81]));

    mockCoinSelection.selectLargestFirst.mockReturnValue([
      [{ txHash: 'test-tx-hash', outputIndex: 0 }],
      []
    ]);

    // Set up environment
    process.env = {
      ...originalEnv,
      NETWORK: 'preprod',
      OWNER_PKH: 'owner-pkh-test',
      MIN_ADA: '2000000',
      MAX_TX_FEE: '500000',
      MIN_CHANGE_AMT: '1000000'
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Commission Calculation', () => {
    it('calculates admin commission correctly', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123', // hexChangeAddr
        'cbor-utxo-1', // cborUtxos
        '100', // coursePrice in ADA
        'addr_test1teacher', // teacherWalletAddr
        'addr_test1admin', // adminWalletAddr
        '20' // adminCommissionPercent
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const module = await import('../build-purchase-tx.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // 20% of 100 ADA (100,000,000 lovelace) = 20 ADA (20,000,000 lovelace)
      // 80% = 80 ADA (80,000,000 lovelace)
      expect(response.adminAmount).toBe('20000000');
      expect(response.teacherAmount).toBe('80000000');
      expect(response.totalAmount).toBe('100000000');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('handles fractional commission percentages', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '50', // coursePrice in ADA
        'addr_test1teacher',
        'addr_test1admin',
        '15.5' // adminCommissionPercent (15.5%)
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // 15.5% of 50 ADA = 7.75 ADA (7,750,000 lovelace)
      // Math.floor is used, so expect 7,750,000
      expect(response.adminAmount).toBe('7750000');
      expect(response.teacherAmount).toBe('42250000');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Transaction Outputs', () => {
    it('creates two transaction outputs', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      // Verify addOutput was called twice (once for teacher, once for admin)
      expect(mockTx.addOutput).toHaveBeenCalledTimes(2);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('creates outputs with correct addresses and amounts', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      // Verify TxOutput constructor calls
      expect(mockTxOutput).toHaveBeenCalledTimes(2);

      // First output should be teacher (80 ADA)
      const firstCall = mockTxOutput.mock.calls[0];
      expect(firstCall[1]).toEqual({ lovelace: 80000000n });

      // Second output should be admin (20 ADA)
      const secondCall = mockTxOutput.mock.calls[1];
      expect(secondCall[1]).toEqual({ lovelace: 20000000n });

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - Insufficient Funds', () => {
    it('returns 501 when insufficient funds', async () => {
      // Mock CoinSelection to throw (simulating insufficient funds)
      mockCoinSelection.selectLargestFirst.mockImplementationOnce(() => {
        throw new Error('Insufficient funds');
      });

      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(501);
      expect(response).toHaveProperty('error');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - General Errors', () => {
    it('returns 500 on other errors', async () => {
      // Mock finalize to throw (simulating error after CoinSelection succeeds)
      mockTx.finalize.mockRejectedValueOnce(new Error('Network error'));

      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response).toHaveProperty('error');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Success Response', () => {
    it('returns cborTx on success', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('cborTx');
      expect(response).toHaveProperty('teacherAmount');
      expect(response).toHaveProperty('adminAmount');
      expect(response).toHaveProperty('totalAmount');
      expect(typeof response.cborTx).toBe('string');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Metadata', () => {
    it('adds transaction metadata with course purchase message', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      // Verify metadata was added
      expect(mockTx.addMetadata).toHaveBeenCalledTimes(1);
      expect(mockTx.addMetadata).toHaveBeenCalledWith(674, expect.any(String));

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Stake Key Validation', () => {
    it('validates stake key hash matches change address', async () => {
      // Mock Address.fromBech32 to return mismatched stake hash
      mockAddress.fromBech32.mockReturnValueOnce({
        stakingHash: { hex: 'different-stake-hash' },
        pubKeyHash: 'test-pub-key-hash',
        toBech32: () => 'addr_test1mismatch'
      });

      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      // Should return an error response due to stake key mismatch
      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // Stake key mismatch happens before CoinSelection, so status should be 501
      expect(response.status).toBe(501);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Network Configuration', () => {
    it('uses testnet configuration when NETWORK is not mainnet', async () => {
      process.env.NETWORK = 'preprod';

      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { config } = await import('@hyperionbt/helios');

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      expect(config.IS_TESTNET).toBe(true);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Signers', () => {
    it('adds both owner and user wallet as signers', async () => {
      process.argv = [
        'node',
        'build-purchase-tx.mjs',
        'test-stake-hash',
        '01abc123',
        'cbor-utxo-1',
        '100',
        'addr_test1teacher',
        'addr_test1admin',
        '20'
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-purchase-tx.mjs?t=' + Date.now());

      // Verify addSigner was called twice
      expect(mockTx.addSigner).toHaveBeenCalledTimes(2);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
