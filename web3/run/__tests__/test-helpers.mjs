import { vi, expect } from 'vitest';

/**
 * Shared test utilities and fixtures for certificate transaction tests
 */

/**
 * Creates mock certificate metadata for testing
 */
export const createMockCertificateMetadata = (overrides = {}) => ({
  course_title: 'Web Development Fundamentals',
  student_name: 'Alice Johnson',
  teacher_name: 'Bob Smith', 
  completion_date: '2024-01-15T10:30:00Z',
  course_id: 'WEB-101',
  cohort: '2024-Q1',
  grade: 'A',
  score: '95',
  serial_number: 'CERT-001',
  student_email: 'alice@example.com',
  ...overrides
});

/**
 * Creates mock process.argv for certificate transaction scripts
 */
export const createMockArgv = (scriptName, {
  recipientAddress = 'addr_test1qqxyz123recipient',
  nftName = 'WebDev101',
  serialNum = '001',
  mph = 'test-minting-policy-hash',
  projectUid = 'proj_123456',
  imageUrl = 'QmTestImageHash123',
  metadata = null
} = {}) => {
  const args = [
    'node',
    scriptName,
    recipientAddress,
    nftName,
    serialNum
  ];

  if (scriptName.includes('nmkr')) {
    args.push(projectUid, imageUrl);
  } else {
    args.push(mph, imageUrl);
  }

  args.push(JSON.stringify(metadata || createMockCertificateMetadata()));
  
  return args;
};

/**
 * Creates mock environment variables for testing
 */
export const createMockEnv = (overrides = {}) => ({
  NETWORK: 'preprod',
  OWNER_PKH: 'owner-pubkey-hash-test',
  OWNER_WALLET_ADDR: 'addr_test1owner_wallet_address',
  MIN_ADA: '2000000',
  MAX_TX_FEE: '500000', 
  MIN_CHANGE_AMT: '1000000',
  TTL_MINUTES: '30',
  BLOCKFROST_API_KEY: 'preprod-test-api-key',
  NMKR_API_KEY: 'nmkr-test-api-key',
  ...overrides
});

/**
 * Mock UTXO data for testing transaction building
 */
export const createMockUtxos = (count = 1) => {
  const utxos = [];
  for (let i = 0; i < count; i++) {
    utxos.push({
      txHash: `tx-hash-${i}`,
      outputIndex: i,
      value: {
        lovelace: 10000000n + BigInt(i * 1000000), // 10+ ADA
        assets: []
      }
    });
  }
  return utxos;
};

/**
 * Creates mock NMKR API responses
 */
export const createMockNmkrResponses = ({
  uploadSuccess = true,
  mintSuccess = true,
  nftUid = 'nft_test_123',
  transactionHash = 'tx_abc123def456'
} = {}) => {
  const responses = [];

  // Upload response
  if (uploadSuccess) {
    responses.push({
      ok: true,
      json: () => Promise.resolve({ nftUid })
    });
  } else {
    responses.push({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Upload failed')
    });
  }

  // Mint response (only if upload succeeded)
  if (uploadSuccess) {
    if (mintSuccess) {
      responses.push({
        ok: true,
        json: () => Promise.resolve({
          sendedNft: [{
            initialMintTxHash: transactionHash,
            recipientAddress: 'addr_test1recipient'
          }]
        })
      });
    } else {
      responses.push({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Minting failed')
      });
    }
  }

  return responses;
};

/**
 * Mock Helios transaction instance for testing
 */
export const createMockTransaction = () => ({
  addInputs: vi.fn().mockReturnThis(),
  attachScript: vi.fn().mockReturnThis(),
  mintTokens: vi.fn().mockReturnThis(),
  addOutput: vi.fn().mockReturnThis(),
  validFrom: vi.fn().mockReturnThis(),
  validTo: vi.fn().mockReturnThis(),
  addSigner: vi.fn().mockReturnThis(),
  addMetadata: vi.fn().mockReturnThis(),
  finalize: vi.fn().mockReturnThis(),
  toCbor: vi.fn(() => new Uint8Array([0x84, 0xa4, 0x00, 0x81]))
});

/**
 * Mock Helios program compilation result
 */
export const createMockCompiledProgram = (mph = 'test-minting-policy-hash') => ({
  mintingPolicyHash: { hex: mph },
  script: 'compiled-script-cbor'
});

/**
 * Creates expected token names for certificate minting
 */
export const getExpectedTokenNames = (nftName, serialNum) => ({
  reference: `(100)${nftName}|${serialNum}`,
  certificate: `(222)${nftName}|${serialNum}`
});

/**
 * Validates response structure for certificate transactions
 */
export const validateSuccessResponse = (response, expectedFields = {}) => {
  expect(response).toHaveProperty('status', 200);
  expect(response).toHaveProperty('nftName');
  expect(response).toHaveProperty('serialNum');
  expect(response).toHaveProperty('recipientAddress');
  expect(response).toHaveProperty('metadata');
  
  // Validate specific fields if provided
  Object.entries(expectedFields).forEach(([key, value]) => {
    expect(response).toHaveProperty(key, value);
  });
};

/**
 * Validates error response structure
 */
export const validateErrorResponse = (response, expectedError = null) => {
  expect(response).toHaveProperty('status', 500);
  expect(response).toHaveProperty('error');
  
  if (expectedError) {
    expect(response.error).toContain(expectedError);
  }
};

/**
 * Mock console methods for testing output
 */
export const mockConsoleOutput = () => {
  const mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => {});
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  
  return {
    mockStdoutWrite,
    mockConsoleError,
    getLastOutput: () => {
      const calls = mockStdoutWrite.mock.calls;
      return calls.length > 0 ? JSON.parse(calls[calls.length - 1][0]) : null;
    },
    getLastError: () => {
      const calls = mockConsoleError.mock.calls;
      return calls.length > 0 ? calls[calls.length - 1] : null;
    }
  };
};

/**
 * Test helper to run a certificate transaction script and capture output
 */
export const runCertificateScript = async (scriptPath) => {
  const { mockStdoutWrite } = mockConsoleOutput();
  
  const { main } = await import(scriptPath);
  await main();
  
  const output = mockStdoutWrite.mock.calls[0]?.[0];
  return output ? JSON.parse(output) : null;
};

/**
 * Creates a test suite template for certificate transaction functions
 * @param {string} scriptName - Name of the script being tested
 * @param {Function} specificTests - Additional test cases specific to the script
 */
export const createCertificateTestSuite = (scriptName, specificTests) => {
  return () => {
    describe(`${scriptName} - Input Validation`, () => {
      it('should validate required parameters');
      it('should validate environment variables');
      it('should handle malformed JSON metadata');
    });

    describe(`${scriptName} - Network Configuration`, () => {
      it('should handle mainnet configuration');
      it('should default to preprod network');
    });

    describe(`${scriptName} - Token Generation`, () => {
      it('should generate correct token names');
      it('should handle special characters in names');
    });

    describe(`${scriptName} - Metadata Processing`, () => {
      it('should build certificate metadata correctly');
      it('should handle missing metadata fields gracefully');
    });

    describe(`${scriptName} - Error Handling`, () => {
      it('should return structured error responses');
      it('should handle network failures');
      it('should handle insufficient funds');
    });

    describe(`${scriptName} - Response Format`, () => {
      it('should return correct success response structure');
      it('should include all required fields');
    });

    // Include script-specific tests
    if (specificTests) {
      specificTests();
    }
  };
};

/**
 * Network-specific test data
 */
export const networkConfigs = {
  mainnet: {
    nmkrBaseUrl: 'https://studio-api.nmkr.io/v2',
    explorerBaseUrl: 'https://cardanoscan.io/transaction'
  },
  preprod: {
    nmkrBaseUrl: 'https://studio-api.preprod.nmkr.io/v2',
    explorerBaseUrl: 'https://preprod.cardanoscan.io/transaction'
  }
};

/**
 * Common regex patterns for validation
 */
export const patterns = {
  cardanoAddress: /^addr(_test)?1[a-z0-9]{53,}$/,
  transactionHash: /^[a-f0-9]{64}$/,
  policyId: /^[a-f0-9]{56}$/,
  assetNameHex: /^[a-f0-9]+$/,
  ipfsHash: /^Qm[a-zA-Z0-9]{44}$/
};