import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let importCounter = 0;
const freshImport = () =>
  import('../build-student-certificate-tx.mjs?t=' + ++importCounter);

// Mock Helios library
const mockMintInstance = {
  _toUplcData: vi.fn(() => 'mock-redeemer-data'),
};

const mockMintConstructor = vi.fn(() => mockMintInstance);

const mockProgram = {
  parameters: {},
  compile: vi.fn(() => ({
    mintingPolicyHash: { hex: 'mock-mph-hex' },
  })),
  types: {
    Redeemer: {
      Mint: mockMintConstructor,
    },
  },
};

const mockTx = {
  addInputs: vi.fn().mockReturnThis(),
  addOutput: vi.fn().mockReturnThis(),
  attachScript: vi.fn().mockReturnThis(),
  mintTokens: vi.fn().mockReturnThis(),
  validFrom: vi.fn().mockReturnThis(),
  validTo: vi.fn().mockReturnThis(),
  addSigner: vi.fn().mockReturnThis(),
  addMetadata: vi.fn().mockReturnThis(),
  finalize: vi.fn().mockResolvedValue(undefined),
  toCbor: vi.fn(() => new Uint8Array([0x84])),
};

const mockAddress = {
  fromHex: vi.fn(() => ({
    pubKeyHash: 'test-pub-key-hash',
  })),
  fromBech32: vi.fn((addr) => ({
    pubKeyHash: 'test-pub-key-hash',
    toBech32: () => addr,
  })),
};

const mockTxInput = {
  fromFullCbor: vi.fn(() => ({
    txHash: 'test-tx-hash',
    outputIndex: 0,
    value: { lovelace: 5000000n },
  })),
};

const mockAssets = vi.fn(function(tokens) {
  return { tokens };
});

const mockValue = vi.fn(function(amount, assets) {
  return { lovelace: amount, assets };
});

const mockTxOutput = vi.fn(function(address, value) {
  return { address, value };
});

const mockPubKeyHash = {
  fromHex: vi.fn(() => 'mock-pub-key-hash'),
};

const mockNetworkParams = vi.fn(function(params) {
  return { params };
});

const mockProgram_new = vi.fn(() => mockProgram);

vi.mock('@hyperionbt/helios', () => ({
  Address: mockAddress,
  Assets: mockAssets,
  bytesToHex: vi.fn(() => 'mock-cbor-hex'),
  hexToBytes: vi.fn((hex) => new Uint8Array([0x00])),
  NetworkParams: mockNetworkParams,
  Program: { new: mockProgram_new },
  PubKeyHash: mockPubKeyHash,
  textToBytes: vi.fn((str) => Buffer.from(str, 'utf-8')),
  Tx: vi.fn(() => mockTx),
  TxInput: mockTxInput,
  TxOutput: mockTxOutput,
  Value: mockValue,
}));

const mockReadFile = vi.fn();
vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
  },
}));

const mockBuildCIP25Metadata = vi.fn(async () => ({ name: 'test' }));
const mockBuildCustomMetadata = vi.fn(() => ({ msg: ['test'] }));

vi.mock('../../common/certificate-metadata.mjs', () => ({
  buildCIP25Metadata: mockBuildCIP25Metadata,
  buildCustomMetadata: mockBuildCustomMetadata,
}));

const mockGetNetworkParams = vi.fn(async () =>
  JSON.stringify({ protocolParams: { minFeeA: 44, minFeeB: 155381 } })
);

vi.mock('../../common/network.mjs', () => ({
  getNetworkParams: mockGetNetworkParams,
}));

const mockSignTx = vi.fn(async () => ({
  toCbor: () => new Uint8Array([0x84]),
}));

vi.mock('../../common/sign-tx.mjs', () => ({
  signTx: mockSignTx,
}));

// ─── Helpers ────────────────────────────────────────────────────────────────

const SUCCESS_ARGV = [
  'node',
  'build-student-certificate-tx.mjs',
  'addr_test1student',
  '/tmp/utxos.json',
  'Certificate-1',
  '12345',
  'QmImageHash',
  '{"name":"Test","description":"Test cert"}',
];

const setupReadFileMocks = () => {
  mockReadFile
    .mockResolvedValueOnce('spending(validator policy_content)')
    .mockResolvedValueOnce(JSON.stringify(['cbor-utxo-1', 'cbor-utxo-2']));
};

describe('build-student-certificate-tx.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv  = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // clearAllMocks does not drain mockOnce queues — reset the file reader
    // explicitly so leftover once-queues from earlier tests cannot bleed in.
    mockReadFile.mockReset();

    // Restore mock implementations after clearAllMocks
    mockTx.addInputs.mockReturnThis();
    mockTx.addOutput.mockReturnThis();
    mockTx.attachScript.mockReturnThis();
    mockTx.mintTokens.mockReturnThis();
    mockTx.validFrom.mockReturnThis();
    mockTx.validTo.mockReturnThis();
    mockTx.addSigner.mockReturnThis();
    mockTx.addMetadata.mockReturnThis();
    mockTx.finalize.mockResolvedValue(undefined);
    mockTx.toCbor.mockReturnValue(new Uint8Array([0x84]));

    mockMintInstance._toUplcData.mockReturnValue('mock-redeemer-data');
    mockMintConstructor.mockReturnValue(mockMintInstance);
    mockProgram.compile.mockReturnValue({ mintingPolicyHash: { hex: 'mock-mph-hex' } });
    mockProgram_new.mockReturnValue(mockProgram);

    mockBuildCIP25Metadata.mockResolvedValue({ name: 'test' });
    mockBuildCustomMetadata.mockReturnValue({ msg: ['test'] });
    mockGetNetworkParams.mockResolvedValue(
      JSON.stringify({ protocolParams: { minFeeA: 44, minFeeB: 155381 } })
    );
    mockSignTx.mockResolvedValue({ toCbor: () => new Uint8Array([0x84]) });

    process.env = {
      ...originalEnv,
      NETWORK: 'preprod',
      OWNER_PKH: 'owner-pkh-test',
      MIN_ADA: '2000000',
      CERTIFICATE_LOCK_DATE: '2025-12-31',
      OWNER_WALLET_ADDR: 'addr_test1owner',
      TTL_MINUTES: '30',
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env  = originalEnv;
    vi.resetModules();
  });

  // ─── Success Response ──────────────────────────────────────────────────────

  describe('Success Response', () => {
    it('returns status 200 with cborTx, nftName, serialNum, mph, recipientAddress, metadata', async () => {
      process.argv = SUCCESS_ARGV;
      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('cborTx');
      expect(response).toHaveProperty('nftName', 'Certificate-1');
      expect(response).toHaveProperty('serialNum', '12345');
      expect(response).toHaveProperty('mph', 'mock-mph-hex');
      expect(response).toHaveProperty('recipientAddress', 'addr_test1student');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toEqual({ name: 'Test', description: 'Test cert' });

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Missing Required Parameters ──────────────────────────────────────────

  describe('Error Handling - Missing Required Parameters', () => {
    it('returns status 500 with "Missing required parameters" when args are absent', async () => {
      process.argv = ['node', 'build-student-certificate-tx.mjs'];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/Missing required parameters/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Missing CERTIFICATE_LOCK_DATE ────────────────────────────────────────

  describe('Error Handling - Missing CERTIFICATE_LOCK_DATE', () => {
    it('returns status 500 with env var error when CERTIFICATE_LOCK_DATE is absent', async () => {
      process.argv = SUCCESS_ARGV;
      delete process.env.CERTIFICATE_LOCK_DATE;

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/CERTIFICATE_LOCK_DATE/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Empty UTXOs Array ─────────────────────────────────────────────────────

  describe('Error Handling - Empty UTXOs Array', () => {
    it('returns status 500 with "No UTXOs provided" when UTXO file is empty array', async () => {
      process.argv = SUCCESS_ARGV;

      mockReadFile
        .mockResolvedValueOnce('spending(validator policy_content)')
        .mockResolvedValueOnce(JSON.stringify([]));

      // TxInput.fromFullCbor maps over the array — empty array produces empty studentUtxos
      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/No UTXOs provided/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Invalid Lock Date Format ──────────────────────────────────────────────

  describe('Error Handling - Invalid Lock Date Format', () => {
    it('returns status 500 with "Invalid CERTIFICATE_LOCK_DATE format" for unparseable date', async () => {
      process.argv = SUCCESS_ARGV;
      process.env.CERTIFICATE_LOCK_DATE = 'not-a-date';

      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockStdoutWrite).toHaveBeenCalled();
      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);

      expect(response.status).toBe(500);
      expect(response.error).toMatch(/Invalid CERTIFICATE_LOCK_DATE format/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Token Naming ──────────────────────────────────────────────────────────

  describe('Token Naming', () => {
    it('uses (100) prefix for reference token and (222) prefix for actual token', async () => {
      process.argv = SUCCESS_ARGV;
      setupReadFileMocks();

      const { textToBytes } = await import('@hyperionbt/helios');

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      const textToBytesCallArgs = textToBytes.mock.calls.map((c) => c[0]);

      expect(textToBytesCallArgs).toContain('(100)Certificate-1|12345');
      expect(textToBytesCallArgs).toContain('(222)Certificate-1|12345');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Two Outputs Created ───────────────────────────────────────────────────

  describe('Transaction Outputs', () => {
    it('creates two outputs: one to student, one to owner', async () => {
      process.argv = SUCCESS_ARGV;
      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockTx.addOutput).toHaveBeenCalledTimes(2);
      expect(mockTxOutput).toHaveBeenCalledTimes(2);

      // First output: student address
      const firstCallAddr = mockTxOutput.mock.calls[0][0];
      expect(firstCallAddr).toEqual(
        expect.objectContaining({ toBech32: expect.any(Function) })
      );
      expect(firstCallAddr.toBech32()).toBe('addr_test1student');

      // Second output: owner address
      const secondCallAddr = mockTxOutput.mock.calls[1][0];
      expect(secondCallAddr.toBech32()).toBe('addr_test1owner');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── CIP-25 Metadata Added ─────────────────────────────────────────────────

  describe('Metadata', () => {
    it('adds CIP-25 metadata with label 721', async () => {
      process.argv = SUCCESS_ARGV;
      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockTx.addMetadata).toHaveBeenCalledWith(721, expect.anything());
      expect(mockTx.addMetadata).toHaveBeenCalledWith(674, expect.anything());
      expect(mockBuildCIP25Metadata).toHaveBeenCalled();

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Owner Signs Transaction ───────────────────────────────────────────────

  describe('Signers', () => {
    it('adds owner PKH as signer for minting policy requirement', async () => {
      process.argv = SUCCESS_ARGV;
      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockTx.addSigner).toHaveBeenCalledTimes(1);
      expect(mockPubKeyHash.fromHex).toHaveBeenCalledWith('owner-pkh-test');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  // ─── Bech32 vs Hex Address ─────────────────────────────────────────────────

  describe('Address Format', () => {
    it('uses Address.fromBech32 when address starts with "addr"', async () => {
      process.argv = SUCCESS_ARGV; // addr_test1student — starts with "addr"
      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      // fromBech32 is called for student addr AND owner addr
      expect(mockAddress.fromBech32).toHaveBeenCalledWith('addr_test1student');
      expect(mockAddress.fromHex).not.toHaveBeenCalled();

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('uses Address.fromHex when address does not start with "addr"', async () => {
      process.argv = [
        'node',
        'build-student-certificate-tx.mjs',
        '01abcdef1234', // hex address — does not start with "addr"
        '/tmp/utxos.json',
        'Certificate-1',
        '12345',
        'QmImageHash',
        '{"name":"Test","description":"Test cert"}',
      ];
      setupReadFileMocks();

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await freshImport();

      expect(mockAddress.fromHex).toHaveBeenCalledWith('01abcdef1234');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
