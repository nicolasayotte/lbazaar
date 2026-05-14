import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import realFs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const flushPromises = () => new Promise((r) => setTimeout(r, 0));

// Load the real Helios minting policy at test load time so the mocked
// fs.readFile can return the actual `.hl` source. This lets us use the real
// `Program` class (via vi.importActual below), which means a future typo like
// `program.parameters = { VERSION: '1.0' }` is caught here at unit-test time
// — not in production. See `common/__tests__/minting-policy-parameters.spec.mjs`
// for the project-wide contract test that polices this across all scripts.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POLICY_HL = realFs.readFileSync(
  path.resolve(__dirname, '../../contracts/nft-minting-policy.hl'),
  'utf8',
);

// Valid 28-byte hex string so real Helios accepts it as a ByteArray for
// OWNER_PKH (the previous `'owner-pkh-test'` is not valid hex and the real
// parameter setter rejects it).
const OWNER_PKH_HEX = '00'.repeat(28);

// Mock everything in @hyperionbt/helios EXCEPT Program. Real Program enforces
// parameter-name validation; the rest stays mocked so this test doesn't depend
// on real CBOR/value plumbing.
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

vi.mock('@hyperionbt/helios', async () => {
  const actual = await vi.importActual('@hyperionbt/helios');
  return {
    Address: mockAddress,
    Assets: mockAssets,
    bytesToHex: vi.fn(() => 'mock-cbor-hex'),
    hexToBytes: vi.fn(() => new Uint8Array([0x00])),
    NetworkParams: mockNetworkParams,
    Program: actual.Program, // REAL — validates parameter names against the .hl
    PubKeyHash: mockPubKeyHash,
    textToBytes: vi.fn((text) => new TextEncoder().encode(text)),
    Tx: vi.fn(function () {
      return mockTx;
    }),
    TxInput: mockTxInput,
    TxOutput: mockTxOutput,
    Value: mockValue,
  };
});

const mockSignTx = vi.fn(() => ({
  toCbor: () => new Uint8Array([0x84]),
}));

const mockGetNetworkParams = vi.fn(async () =>
  JSON.stringify({ protocolParams: { minFeeA: 44, minFeeB: 155381 } }),
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
    .mockResolvedValueOnce(POLICY_HL) // real policy source, parsed by real Helios
    .mockResolvedValueOnce('["cbor-utxo-1","cbor-utxo-2"]'); // utxo file
};

describe('build-student-token-tx.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTx.addInputs.mockReturnThis();
    mockTx.attachScript.mockReturnThis();
    mockTx.mintTokens.mockReturnThis();
    mockTx.addOutput.mockReturnThis();
    mockTx.validFrom.mockReturnThis();
    mockTx.validTo.mockReturnThis();
    mockTx.addSigner.mockReturnThis();
    mockTx.addMetadata.mockReturnThis();
    mockTx.finalize.mockResolvedValue(undefined);

    process.env = {
      ...originalEnv,
      NETWORK: 'preprod',
      OWNER_PKH: OWNER_PKH_HEX,
      CERTIFICATE_LOCK_DATE: '2099-12-31T23:59:59Z',
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
      expect(typeof response.mph).toBe('string');
      expect(response.mph).toMatch(/^[0-9a-f]+$/i);
      expect(response.recipientAddress).toBe('addr_test1student');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - Missing Parameters', () => {
    it('returns status 500 with error message when required args are missing', async () => {
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

  describe('Error Handling - Missing CERTIFICATE_LOCK_DATE', () => {
    it('returns status 500 when CERTIFICATE_LOCK_DATE env var is not set', async () => {
      delete process.env.CERTIFICATE_LOCK_DATE;

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

      const response = JSON.parse(mockStdoutWrite.mock.calls[0][0]);
      expect(response.status).toBe(500);
      expect(response.error).toMatch(/CERTIFICATE_LOCK_DATE/);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Error Handling - Zero Quantity', () => {
    it('returns status 500 with "Quantity must be a positive integer" for quantity 0', async () => {
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
        .mockResolvedValueOnce(POLICY_HL) // real policy source
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
      const msgEntry = metadata.map.find(([k]) => k === 'msg');

      expect(label).toBe(674);
      expect(msgEntry[1]).toContain('Course: 42');
      expect(msgEntry[1]).toContain('Token reward');
      expect(msgEntry[1]).toContain('Quantity: 10');

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
      const msgEntry = metadata.map.find(([k]) => k === 'msg');
      expect(msgEntry[1]).toContain('Course: Participation-Badge');

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
      expect(mockTxOutput).toHaveBeenCalledTimes(1);
      const [outputAddr] = mockTxOutput.mock.calls[0];
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

      expect(mockPubKeyHash.fromHex).toHaveBeenCalledWith(OWNER_PKH_HEX);
      expect(mockTx.addSigner).toHaveBeenCalledWith(`pkh:${OWNER_PKH_HEX}`);

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
        '01deadbeef1234567890abcdef',
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
