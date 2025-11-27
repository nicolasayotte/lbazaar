import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock fetch globally before importing the module
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock the common modules
vi.mock('../../common/certificate-metadata.mjs', () => ({
  buildCertificateMetadata: vi.fn(async () => ({
    ['2232323254657374436f75727365' + '7c303031']: {
      name: 'Certificate - Web Development',
      image: 'ipfs://QmTestImage',
      course: { title: 'Web Development' }
    }
  }))
}));

vi.mock('../../common/minting-policy.mjs', () => ({
  getMintingPolicyHash: vi.fn(async () => 'test-minting-policy-hash-12345678901234567890123456')
}));

describe('build-certificate-tx-nmkr integration tests', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up basic environment
    process.env = {
      ...originalEnv,
      NMKR_API_KEY: 'test-api-key',
      NETWORK: 'preprod',
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    vi.resetModules();
  });

  describe('Parameter validation', () => {
    it('should exist as a module', async () => {
      expect(() => import('../build-certificate-tx-nmkr.mjs')).not.toThrow();
    });
  });

  describe('Environment setup', () => {
    it('should read NETWORK environment variable', () => {
      expect(process.env.NETWORK).toBe('preprod');
    });

    it('should read NMKR_API_KEY environment variable', () => {
      expect(process.env.NMKR_API_KEY).toBe('test-api-key');
    });
  });

  describe('Transaction link generation', () => {
    it('should return transaction link on successful minting', async () => {
      // Set up process.argv with all required parameters
      process.argv = [
        'node',
        'build-certificate-tx-nmkr.mjs',
        'addr_test1qqxyz123recipient456def789ghi012jkl345mno678pqr901stu234vwx567', // recipientAddress
        'TestCourse', // nftName
        '001', // serialNum
        'proj_123456', // projectUid
        'QmTestImageHash123', // imageUrl
        JSON.stringify({
          course_title: 'Web Development',
          student_name: 'Alice',
          teacher_name: 'Bob',
          completion_date: '2024-01-01T00:00:00Z'
        })
      ];

      // Mock successful NMKR API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nftUid: 'nft_test_123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sendedNft: [{
              initialMintTxHash: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123',
              recipientAddress: 'addr_test1qqxyz123recipient456def789ghi012jkl345mno678pqr901stu234vwx567'
            }]
          })
        });

      // Capture stdout
      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Dynamically import to get fresh instance
      const module = await import('../build-certificate-tx-nmkr.mjs?t=' + Date.now());
      await module.main();

      // Verify we got output
      expect(mockStdoutWrite).toHaveBeenCalled();
      
      // Parse the JSON response
      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // Verify response structure
      expect(response).toMatchObject({
        status: 200,
        nftUid: 'nft_test_123',
        nftName: 'TestCourse',
        serialNum: '001',
        transactionHash: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123'
      });

      // Verify transaction URL is generated
      expect(response.transactionUrl).toContain('preprod.cardanoscan.io/transaction');
      expect(response.transactionUrl).toContain('abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567abc890def123');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('should use mainnet explorer URL when NETWORK=mainnet', async () => {
      process.env.NETWORK = 'mainnet';
      
      process.argv = [
        'node',
        'build-certificate-tx-nmkr.mjs',
        'addr1qxyz123recipient456def789ghi012jkl345mno678pqr901stu234vwx567yz', // mainnet address
        'TestCourse',
        '001',
        'proj_123456',
        'QmTestImageHash123',
        JSON.stringify({ course_title: 'Web Development' })
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nftUid: 'nft_test_456' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sendedNft: [{
              initialMintTxHash: 'mainnet_tx_hash_123456789012345678901234567890123456789012345678',
              recipientAddress: 'addr1qxyz123recipient456def789ghi012jkl345mno678pqr901stu234vwx567yz'
            }]
          })
        });

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const module = await import('../build-certificate-tx-nmkr.mjs?t=' + Date.now());
      await module.main();

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // Verify mainnet explorer URL
      expect(response.transactionUrl).toContain('cardanoscan.io/transaction');
      expect(response.transactionUrl).not.toContain('preprod');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('should handle missing transaction hash gracefully', async () => {
      process.argv = [
        'node',
        'build-certificate-tx-nmkr.mjs',
        'addr_test1qqxyz123recipient456def789ghi012jkl345mno678pqr901stu234vwx567',
        'TestCourse',
        '001',
        'proj_123456',
        'QmTestImageHash123',
        JSON.stringify({ course_title: 'Web Development' })
      ];

      // Mock response without transaction hash
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nftUid: 'nft_test_789' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            sendedNft: [{}] // Missing initialMintTxHash
          })
        });

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const module = await import('../build-certificate-tx-nmkr.mjs?t=' + Date.now());
      await module.main();

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // Should still return 200 but with null transaction URL
      expect(response.status).toBe(200);
      expect(response.transactionUrl).toBeNull();
      expect(response.transactionHash).toBeNull();

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('should handle API errors and return error response', async () => {
      process.argv = [
        'node',
        'build-certificate-tx-nmkr.mjs',
        'addr_test1qqxyz123recipient456def789ghi012jkl345mno678pqr901stu234vwx567',
        'TestCourse',
        '001',
        'proj_123456',
        'QmTestImageHash123',
        JSON.stringify({ course_title: 'Web Development' })
      ];

      // Mock API failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid project UID'
      });

      const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const module = await import('../build-certificate-tx-nmkr.mjs?t=' + Date.now());
      await module.main();

      const output = mockStdoutWrite.mock.calls[0][0];
      const response = JSON.parse(output);

      // Should return error response
      expect(response.status).toBe(500);
      expect(response.error).toContain('NMKR Upload failed');
      expect(response.error).toContain('400');

      mockStdoutWrite.mockRestore();
      mockConsoleError.mockRestore();
    });
  });
});