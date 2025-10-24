// filepath: docs/test_certificate-minting-nmkr.md
// Note: This is a Markdown file containing test code. Run tests with Jest.

import { jest } from '@jest/globals';
import axios from 'axios';
import { buildCertificateMetadata } from '../web3/common/certificate-metadata.mjs';

// Mock axios for API calls
jest.mock('axios');
jest.mock('../web3/common/certificate-metadata.mjs');

// Mock fs for file operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

// Mock process.argv for command-line args
const originalArgv = process.argv;
beforeEach(() => {
  process.argv = ['node', 'build-certificate-tx-nmkr.mjs', 'addr_test1...', 'nftName', '001', 'proj_123', 'QmHash', '{"key":"value"}'];
  process.env.NMKR_API_KEY = 'mock_api_key';
  process.env.NETWORK = 'preprod';
});

afterEach(() => {
  process.argv = originalArgv;
  jest.clearAllMocks();
});

describe('build-certificate-tx-nmkr.mjs', () => {
  describe('Input Validation', () => {
    test('should throw error if recipientAddress is missing', async () => {
      process.argv = ['node', 'build-certificate-tx-nmkr.mjs'];
      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      await expect(main()).rejects.toThrow('Missing required arguments');
    });

    test('should throw error if NMKR_API_KEY is not set', async () => {
      delete process.env.NMKR_API_KEY;
      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      await expect(main()).rejects.toThrow('NMKR_API_KEY environment variable is required');
    });

    // Add more validation tests for other required args
  });

  describe('Metadata Building', () => {
    test('should build certificate metadata correctly', async () => {
      const mockMetadata = { name: 'Test Certificate' };
      buildCertificateMetadata.mockResolvedValue(mockMetadata);

      const metadataJson = '{"course_title":"Test"}';
      const metadata = JSON.parse(metadataJson);
      const assetNameHex = 'mock_hex';
      const imageUrl = 'QmHash';

      const result = await buildCertificateMetadata(metadata, assetNameHex, imageUrl);

      expect(buildCertificateMetadata).toHaveBeenCalledWith(metadata, assetNameHex, imageUrl);
      expect(result).toEqual(mockMetadata);
    });

    test('should handle invalid JSON metadata', async () => {
      const invalidJson = '{invalid}';
      process.argv[7] = invalidJson;

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      await expect(main()).rejects.toThrow('Invalid JSON in metadata');
    });
  });

  describe('API Interactions', () => {
    test('should upload NFT successfully', async () => {
      axios.post.mockResolvedValueOnce({
        data: { uid: 'nft_123' }
      });

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await main();

      expect(axios.post).toHaveBeenCalledWith(
        'https://studio-api.preprod.nmkr.io/v2/UploadNft/proj_123',
        expect.any(Object),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock_api_key',
            'Content-Type': 'application/json'
          }
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"status": 200'));
    });

    test('should mint and send NFT successfully', async () => {
      axios.post
        .mockResolvedValueOnce({ data: { uid: 'nft_123' } }) // Upload
        .mockResolvedValueOnce({ data: { sendedNft: [{ initialMintTxHash: 'tx_123' }] } }); // Mint specific

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await main();

      // Verify upload call uses metadataOverride instead of metadataPlaceholder
      expect(axios.post).toHaveBeenCalledWith(
        'https://studio-api.preprod.nmkr.io/v2/UploadNft/proj_123',
        expect.objectContaining({
          metadataOverride: expect.any(String)
        }),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock_api_key',
            'Content-Type': 'application/json'
          }
        })
      );

      // Verify mint call uses MintAndSendSpecific with nftUid
      expect(axios.post).toHaveBeenCalledWith(
        'https://studio-api.preprod.nmkr.io/v2/MintAndSendSpecific/proj_123/nft_123/1/addr_test1...',
        undefined,
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock_api_key'
          }
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"status": 200'));
    });

    test('should handle API upload failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Upload failed'));

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await main();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"status": 500'));
    });

    test('should handle API mint failure', async () => {
      axios.post
        .mockResolvedValueOnce({ data: { uid: 'nft_123' } }) // Upload succeeds
        .mockRejectedValueOnce(new Error('Mint failed')); // Mint fails

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await main();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"status": 500'));
    });
  });

  describe('Response Formatting', () => {
    test('should return correct success response structure', async () => {
      axios.post
        .mockResolvedValueOnce({ data: { uid: 'nft_123' } })
        .mockResolvedValueOnce({ data: { transactionHash: 'tx_123' } });

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await main();

      const loggedOutput = consoleSpy.mock.calls[0][0];
      const response = JSON.parse(loggedOutput);

      expect(response).toHaveProperty('status', 200);
      expect(response).toHaveProperty('nftUid');
      expect(response).toHaveProperty('transactionUrl');
      expect(response).toHaveProperty('metadata');
      expect(response).toHaveProperty('mintedNftDetails');
    });

    test('should return correct error response structure', async () => {
      axios.post.mockRejectedValueOnce(new Error('API Error'));

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await main();

      const loggedOutput = consoleSpy.mock.calls[0][0];
      const response = JSON.parse(loggedOutput);

      expect(response).toHaveProperty('status', 500);
      expect(response).toHaveProperty('error');
    });
  });

  describe('Network Configuration', () => {
    test('should use mainnet URL when NETWORK=mainnet', async () => {
      process.env.NETWORK = 'mainnet';

      axios.post.mockResolvedValue({ data: { uid: 'nft_123' } });

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');

      await main();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('studio-api.nmkr.io'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    test('should default to preprod when NETWORK is not set', async () => {
      delete process.env.NETWORK;

      axios.post.mockResolvedValue({ data: { uid: 'nft_123' } });

      const { main } = await import('../web3/run/build-certificate-tx-nmkr.mjs');

      await main();

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('studio-api.preprod.nmkr.io'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
