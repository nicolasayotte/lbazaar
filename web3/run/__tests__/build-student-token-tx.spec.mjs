import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const flushPromises = () => new Promise(r => setTimeout(r, 0));

// Mock Helios library
const mockMintRedeemer = { _toUplcData: vi.fn(() => 'mock-redeemer-data') };
const MockMintClass = vi.fn(function() { return mockMintRedeemer; });

const mockProgram = {
  parameters: {},
  compile: vi.fn(() => ({
    mintingPolicyHash: { hex: 'mock-mph-hex' },
  })),
  types: {
    Redeemer: {
      Mint: MockMintClass,
    },
  },
};

const mockProgramNew = vi.fn(() => mockProgram);

const mockTx = {
  addInputs: vi.fn().mockReturnThis(),
  attachScript: vi.fn().mockReturnThis(),
  mintTokens: vi.fn().mockReturnThis(),
  addOutput: vi.fn().mockReturnThis(),
  validFrom: vi.fn().mockReturnThis(),
  validTo: vi.fn().mockReturnThis(),
  addSigner: vi.fn().mockReturnThis(),
  addMetadata: vi.fn().mockReturnThis(),
  finalize: vi.fn().mockResolvedValue(undefined),
};

const mockAddress = {
  fromHex: vi.fn(() => ({ type: 'hex-address' })),
  fromBech32: vi.fn((addr) => ({ type: 'bech32-address', raw: addr })),
};

const mockTxInput = {
  fromFullCbor: vi.fn(() => ({
    txHash: 'test-tx-hash',
    outputIndex: 0,
    value: { lovelace: 5000000n },
  })),
};

const mockValue = vi.fn(function (amount, assets) {
  return { lovelace: amount, assets };
});

const mockAssets = vi.fn(function (entries) {
  return { entries };
});

const mockTxOutput = vi.fn(function (address, value) {
  return { address, value };
});

const mockPubKeyHash = {
  fromHex: vi.fn((hex) => `pkh:${hex}`),
};

const mockNetworkParams = vi.fn(function (params) {
  return { params };
});

vi.mock('@hyperionbt/helios', () => ({
  Address: mockAddress,
  Assets: mockAssets,
  bytesToHex: vi.fn(() => 'mock-cbor-hex'),
  hexToBytes: vi.fn((hex) => new Uint8Array([0x00])),
  NetworkParams: mockNetworkParams,
  Program: { new: mockProgramNew },
  PubKeyHash: mockPubKeyHash,
  textToBytes: vi.fn((text) => new TextEncoder().encode(text)),
  Tx: vi.fn(function() { return mockTx; }),
  TxInput: mockTxInput,
  TxOutput: mockTxOutput,
  Value: mockValue,
}));

const mockSignTx = vi.fn(() => ({
  toCbor: () => new Uint8Array([0x84]),
}));

const mockGetNetworkParams = vi.fn(async () =>
  JSON.stringify({ protocolParams: { minFeeA: 44, minFeeB: 155381 } })
);

vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

vi.mock('../../common/sign-tx.mjs', () => ({
  signTx: mockSignTx,
}));

vi.mock('../../common/network.mjs', () => ({
  getNetworkParams: mockGetNetworkParams,
}));

const setupFsReadFile = async () => {
  const { default: fs } = await import('fs/promises');
  fs.readFile
    .mockResolvedValueOnce('spending validator src') // policy file
    .mockResolvedValueOnce('["cbor-utxo-1","cbor-utxo-2"]'); // utxo file
};

describe('build-student-token-tx.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations that need to persist per-test
    mockTx.addInputs.mockReturnThis();
    mockTx.attachScript.mockReturnThis();
    mockTx.mintTokens.mockReturnThis();
    mockTx.addOutput.mockReturnThis();
    mockTx.validFrom.mockReturnThis();
    mockTx.validTo.mockReturnThis();
    mockTx.addSigner.mockReturnThis();
    mockTx.addMetadata.mockReturnThis();
    mockTx.finalize.mockResolvedValue(undefined);

    mockProgram.compile.mockReturnValue({ mintingPolicyHash: { hex: 'mock-mph-hex' } });
    mockMintRedeemer._toUplcData.mockReturnValue('mock-redeemer-data');

    process.env = {
      ...originalEnv,
      NETWORK: 'preprod',
      OWNER_PKH: 'owner-pkh-test',
      MIN_ADA: '2000000',
      TTL_MINUTES: '30',
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Success Response', () => {
    it('returns status 200 with cborTx, tokenName, quantity, mph, and recipientAddress', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('cborTx');
      expect(typeof response.cborTx).toBe('string');
      expect(response.tokenName).toBe('Token-42');
      expect(response.quantity).toBe('10');
      expect(response.mph).toBe('mock-mph-hex');
      expect(response.recipientAddress).toBe('addr_test1student');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - Missing Parameters', () => {
    it('returns status 500 with error message when required args are missing', async () => {
      // Provide only studentAddress, omit everything else
      process.argv = ['node', 'build-student-token-tx.mjs', 'addr_test1student'];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/Missing required parameters/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - Zero Quantity', () => {
    it('returns status 500 with "Quantity must be a positive integer" for quantity 0', async () => {
      // fs.readFile is not called before the quantity check, but mock anyway
      const { default: fs } = await import('fs/promises');
      fs.readFile.mockResolvedValue('[]');

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '0',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/Quantity must be a positive integer/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - Empty UTXOs', () => {
    it('returns status 500 with "No UTXOs provided" when UTXO file contains empty array', async () => {
      const { default: fs } = await import('fs/promises');
      fs.readFile
        .mockResolvedValueOnce('spending validator src') // policy file
        .mockResolvedValueOnce('[]'); // empty utxo list

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/No UTXOs provided/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Metadata Extraction', () => {
    it('extracts numeric course ID from "Token-42" token name into metadata', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockTx.addMetadata).toHaveBeenCalledTimes(1);
      const [label, metadata] = mockTx.addMetadata.mock.calls[0];

      expect(label).toBe(674);
      expect(metadata.msg).toContain('Course: 42');
      expect(metadata.msg).toContain('Token reward');
      expect(metadata.msg).toContain('Quantity: 10');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('uses raw token name in metadata when name does not match Token-<n> pattern', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Participation-Badge',
        '1',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      const [, metadata] = mockTx.addMetadata.mock.calls[0];
      expect(metadata.msg).toContain('Course: Participation-Badge');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Transaction Outputs', () => {
    it('creates exactly one output directed to the student', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockTx.addOutput).toHaveBeenCalledTimes(1);
      // The TxOutput constructor receives student address as first arg
      expect(mockTxOutput).toHaveBeenCalledTimes(1);
      const [outputAddr] = mockTxOutput.mock.calls[0];
      // fromBech32 was called for the bech32 address
      expect(outputAddr).toEqual(expect.objectContaining({ type: 'bech32-address' }));

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Signers', () => {
    it('adds owner PKH as a signer', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockPubKeyHash.fromHex).toHaveBeenCalledWith('owner-pkh-test');
      expect(mockTx.addSigner).toHaveBeenCalledWith('pkh:owner-pkh-test');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Address Handling', () => {
    it('uses Address.fromBech32 for addresses starting with "addr"', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        'addr_test1student',
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockAddress.fromBech32).toHaveBeenCalledWith('addr_test1student');
      expect(mockAddress.fromHex).not.toHaveBeenCalled();

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('uses Address.fromHex for non-bech32 hex addresses', async () => {
      await setupFsReadFile();

      process.argv = [
        'node',
        'build-student-token-tx.mjs',
        '01deadbeef1234567890abcdef', // hex address (does not start with "addr")
        '/tmp/utxos.json',
        'Token-42',
        '10',
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../build-student-token-tx.mjs?t=' + Date.now());
      await flushPromises();

      expect(mockAddress.fromHex).toHaveBeenCalledWith('01deadbeef1234567890abcdef');
      expect(mockAddress.fromBech32).not.toHaveBeenCalled();

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
