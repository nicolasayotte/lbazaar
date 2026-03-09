import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Helios library
const mockSignatures = [{ signature: 'test-signature' }];

const mockTxWitnesses = {
  fromCbor: vi.fn(() => ({
    signatures: mockSignatures
  }))
};

const mockTxOutputs = [];

const mockTxBody = {
  outputs: {
    values: vi.fn(() => mockTxOutputs)
  }
};

const mockTx = {
  body: mockTxBody,
  addSignatures: vi.fn(),
  toCbor: vi.fn(() => new Uint8Array([0x84, 0xa4, 0x00, 0x81]))
};

const mockTxFromCbor = vi.fn(() => mockTx);

vi.mock('@hyperionbt/helios', () => ({
  hexToBytes: vi.fn((hex) => new Uint8Array([0x00])),
  Tx: {
    fromCbor: mockTxFromCbor
  },
  TxWitnesses: mockTxWitnesses
}));

const mockSubmitTx = vi.fn(async () => 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123');

vi.mock('../../common/sign-tx.mjs', () => ({
  submitTx: mockSubmitTx
}));

describe('submit-purchase-tx.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock implementations
    mockTxOutputs.length = 0;
    mockTxBody.outputs.values.mockReturnValue(mockTxOutputs);
    mockTx.addSignatures.mockClear();
    mockSubmitTx.mockResolvedValue('abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123');

    process.env = {
      ...originalEnv,
      NETWORK: 'preprod'
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Payment Verification', () => {
    it('verifies teacher payment exists in outputs', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      // Add outputs with teacher and admin payments
      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature', // cborSig
        'cbor-transaction', // cborTx
        teacherAddr, // teacherWalletAddr
        adminAddr // adminWalletAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      expect(mockStdoutWrite).toHaveBeenCalled();
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('teacherAmount');
      expect(response.teacherAmount).toBe('80'); // Converted from lovelace to ADA

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('verifies admin payment exists in outputs', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('adminAmount');
      expect(response.adminAmount).toBe('20'); // Converted from lovelace to ADA

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('returns error when teacher payment not found', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      // Only add admin output, missing teacher
      mockTxOutputs.push({
        address: { toBech32: () => adminAddr },
        value: { lovelace: 20000000n }
      });

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response).toHaveProperty('error');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('returns error when admin payment not found', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      // Only add teacher output, missing admin
      mockTxOutputs.push({
        address: { toBech32: () => teacherAddr },
        value: { lovelace: 80000000n }
      });

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response).toHaveProperty('error');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Transaction Submission', () => {
    it('returns txId on successful submission', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';
      const expectedTxId = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123';

      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      mockSubmitTx.mockResolvedValueOnce(expectedTxId);

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      expect(mockSubmitTx).toHaveBeenCalledTimes(1);
      expect(mockSubmitTx).toHaveBeenCalledWith(mockTx);

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response.txId).toBe(expectedTxId);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('returns 500 on submission error', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      mockSubmitTx.mockRejectedValueOnce(new Error('Network submission failed'));

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('date');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Amount Conversion', () => {
    it('converts lovelace to ADA in response', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      // Set specific amounts: 85.5 ADA teacher, 14.5 ADA admin
      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 85500000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 14500000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // Verify conversion from lovelace to ADA
      expect(response.teacherAmount).toBe('85.5');
      expect(response.adminAmount).toBe('14.5');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('converts whole ADA amounts correctly', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      // Whole numbers: 100 ADA teacher, 25 ADA admin
      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 100000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 25000000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.teacherAmount).toBe('100');
      expect(response.adminAmount).toBe('25');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Signature Handling', () => {
    it('adds user signature to transaction', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      // Verify signature was added to transaction
      expect(mockTx.addSignatures).toHaveBeenCalledTimes(1);
      expect(mockTx.addSignatures).toHaveBeenCalledWith(mockSignatures);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Response Format', () => {
    it('includes timestamp in success response', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(200);
      expect(response).toHaveProperty('date');
      expect(response).toHaveProperty('txId');
      expect(response).toHaveProperty('teacherAmount');
      expect(response).toHaveProperty('adminAmount');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('includes timestamp in error response', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      // Missing outputs to trigger error
      mockTxOutputs.length = 0;

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      expect(response.status).toBe(500);
      expect(response).toHaveProperty('date');
      expect(response).toHaveProperty('error');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });

  describe('Transaction Reconstruction', () => {
    it('reconstructs transaction from CBOR', async () => {
      const teacherAddr = 'addr_test1teacher';
      const adminAddr = 'addr_test1admin';

      mockTxOutputs.push(
        {
          address: { toBech32: () => teacherAddr },
          value: { lovelace: 80000000n }
        },
        {
          address: { toBech32: () => adminAddr },
          value: { lovelace: 20000000n }
        }
      );

      process.argv = [
        'node',
        'submit-purchase-tx.mjs',
        'cbor-signature',
        'cbor-transaction',
        teacherAddr,
        adminAddr
      ];

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      await import('../submit-purchase-tx.mjs?t=' + Date.now());

      // Verify Tx.fromCbor was called
      expect(mockTxFromCbor).toHaveBeenCalledTimes(1);

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});
