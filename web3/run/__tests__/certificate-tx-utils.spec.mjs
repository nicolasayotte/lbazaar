import { describe, it, expect } from 'vitest';
import {
  createMockCertificateMetadata,
  createMockArgv,
  createMockEnv,
  getExpectedTokenNames,
  validateSuccessResponse,
  validateErrorResponse,
  networkConfigs,
  patterns
} from './test-helpers.mjs';

describe('Certificate Transaction Utilities', () => {
  describe('Mock Data Generators', () => {
    it('createMockCertificateMetadata creates valid metadata', () => {
      const metadata = createMockCertificateMetadata();
      
      expect(metadata).toHaveProperty('course_title');
      expect(metadata).toHaveProperty('student_name');
      expect(metadata).toHaveProperty('teacher_name');
      expect(metadata).toHaveProperty('completion_date');
      expect(metadata.course_title).toBe('Web Development Fundamentals');
    });

    it('createMockCertificateMetadata accepts overrides', () => {
      const metadata = createMockCertificateMetadata({
        course_title: 'Custom Course',
        student_name: 'Custom Student'
      });
      
      expect(metadata.course_title).toBe('Custom Course');
      expect(metadata.student_name).toBe('Custom Student');
      expect(metadata).toHaveProperty('teacher_name'); // Still has defaults
    });

    it('createMockArgv generates correct arguments for NMKR script', () => {
      const argv = createMockArgv('build-certificate-tx-nmkr.mjs', {
        recipientAddress: 'addr_test1xyz',
        nftName: 'Test',
        serialNum: '123',
        projectUid: 'proj_456'
      });
      
      expect(argv[0]).toBe('node');
      expect(argv[1]).toBe('build-certificate-tx-nmkr.mjs');
      expect(argv[2]).toBe('addr_test1xyz');
      expect(argv[3]).toBe('Test');
      expect(argv[4]).toBe('123');
      expect(argv[5]).toBe('proj_456');
    });

    it('createMockArgv generates correct arguments for direct minting script', () => {
      const argv = createMockArgv('build-certificate-tx.mjs', {
        recipientAddress: 'addr_test1xyz',
        mph: 'test-mph-hash'
      });
      
      expect(argv[1]).toBe('build-certificate-tx.mjs');
      expect(argv[5]).toBe('test-mph-hash');
    });

    it('createMockEnv provides all required environment variables', () => {
      const env = createMockEnv();
      
      expect(env).toHaveProperty('NETWORK');
      expect(env).toHaveProperty('OWNER_PKH');
      expect(env).toHaveProperty('OWNER_WALLET_ADDR');
      expect(env).toHaveProperty('MIN_ADA');
      expect(env).toHaveProperty('MAX_TX_FEE');
      expect(env).toHaveProperty('NMKR_API_KEY');
    });

    it('createMockEnv accepts overrides', () => {
      const env = createMockEnv({ NETWORK: 'mainnet' });
      
      expect(env.NETWORK).toBe('mainnet');
    });
  });

  describe('Token Name Generation', () => {
    it('getExpectedTokenNames generates correct reference token', () => {
      const names = getExpectedTokenNames('TestCourse', '001');
      
      expect(names.reference).toBe('(100)TestCourse|001');
    });

    it('getExpectedTokenNames generates correct certificate token', () => {
      const names = getExpectedTokenNames('TestCourse', '001');
      
      expect(names.certificate).toBe('(222)TestCourse|001');
    });

    it('handles different course names and serial numbers', () => {
      const names = getExpectedTokenNames('Advanced-Web3', '999');
      
      expect(names.reference).toBe('(100)Advanced-Web3|999');
      expect(names.certificate).toBe('(222)Advanced-Web3|999');
    });
  });

  describe('Response Validation', () => {
    it('validateSuccessResponse checks required fields', () => {
      const response = {
        status: 200,
        nftName: 'Test',
        serialNum: '001',
        recipientAddress: 'addr_test1xyz',
        metadata: {}
      };
      
      expect(() => validateSuccessResponse(response)).not.toThrow();
    });

    it('validateSuccessResponse validates specific fields', () => {
      const response = {
        status: 200,
        nftName: 'Test',
        serialNum: '001',
        recipientAddress: 'addr_test1xyz',
        metadata: {},
        customField: 'customValue'
      };
      
      expect(() => validateSuccessResponse(response, {
        customField: 'customValue'
      })).not.toThrow();
    });

    it('validateErrorResponse checks error structure', () => {
      const response = {
        status: 500,
        error: 'Something went wrong'
      };
      
      expect(() => validateErrorResponse(response)).not.toThrow();
    });

    it('validateErrorResponse can check specific error messages', () => {
      const response = {
        status: 500,
        error: 'Network connection failed'
      };
      
      expect(() => validateErrorResponse(response, 'Network')).not.toThrow();
    });
  });

  describe('Network Configuration', () => {
    it('provides mainnet configuration', () => {
      expect(networkConfigs.mainnet).toHaveProperty('nmkrBaseUrl');
      expect(networkConfigs.mainnet).toHaveProperty('explorerBaseUrl');
      expect(networkConfigs.mainnet.nmkrBaseUrl).toContain('nmkr.io');
    });

    it('provides preprod configuration', () => {
      expect(networkConfigs.preprod).toHaveProperty('nmkrBaseUrl');
      expect(networkConfigs.preprod.nmkrBaseUrl).toContain('preprod');
    });

    it('mainnet and preprod have different URLs', () => {
      expect(networkConfigs.mainnet.nmkrBaseUrl).not.toBe(networkConfigs.preprod.nmkrBaseUrl);
      expect(networkConfigs.mainnet.explorerBaseUrl).not.toBe(networkConfigs.preprod.explorerBaseUrl);
    });
  });

  describe('Validation Patterns', () => {
    it('cardanoAddress pattern matches valid testnet addresses', () => {
      // Cardano addresses need at least 53 chars after addr_test1
      expect('addr_test1qqxyz123abc456def789ghi012jkl345mno678pqr901stu234vwx567').toMatch(patterns.cardanoAddress);
    });

    it('cardanoAddress pattern matches valid mainnet addresses', () => {
      // Cardano addresses need at least 53 chars after addr1
      expect('addr1qxyz123abc456def789ghi012jkl345mno678pqr901stu234vwx567yz').toMatch(patterns.cardanoAddress);
    });

    it('transactionHash pattern matches valid hashes', () => {
      const validHash = 'a'.repeat(64);
      expect(validHash).toMatch(patterns.transactionHash);
    });

    it('policyId pattern matches valid policy IDs', () => {
      const validPolicy = 'b'.repeat(56);
      expect(validPolicy).toMatch(patterns.policyId);
    });

    it('ipfsHash pattern matches valid IPFS hashes', () => {
      expect('QmTzQ1JRkWErjk39mryYw2WVaphAZNAREyMchXzYywCz7A').toMatch(patterns.ipfsHash);
    });

    it('assetNameHex pattern matches hexadecimal strings', () => {
      expect('48656c6c6f').toMatch(patterns.assetNameHex);
      expect('123abc').toMatch(patterns.assetNameHex);
      expect('xyz').not.toMatch(patterns.assetNameHex);
    });
  });

  describe('Environment Variable Defaults', () => {
    it('provides sensible ADA amount defaults', () => {
      const env = createMockEnv();
      
      expect(parseInt(env.MIN_ADA)).toBeGreaterThan(0);
      expect(parseInt(env.MAX_TX_FEE)).toBeGreaterThan(0);
      expect(parseInt(env.MIN_CHANGE_AMT)).toBeGreaterThan(0);
    });

    it('defaults to preprod network', () => {
      const env = createMockEnv();
      
      expect(env.NETWORK).toBe('preprod');
    });

    it('provides default TTL', () => {
      const env = createMockEnv();
      
      expect(env.TTL_MINUTES).toBe('30');
    });
  });

  describe('Token Name Format Validation', () => {
    it('reference token uses (100) prefix', () => {
      const { reference } = getExpectedTokenNames('Course', '1');
      
      expect(reference).toMatch(/^\(100\)/);
    });

    it('certificate token uses (222) prefix', () => {
      const { certificate } = getExpectedTokenNames('Course', '1');
      
      expect(certificate).toMatch(/^\(222\)/);
    });

    it('tokens use pipe separator', () => {
      const names = getExpectedTokenNames('Course', '1');
      
      expect(names.reference).toContain('|');
      expect(names.certificate).toContain('|');
    });

    it('tokens preserve name and serial number', () => {
      const names = getExpectedTokenNames('MySpecialCourse', '42');
      
      expect(names.reference).toContain('MySpecialCourse');
      expect(names.reference).toContain('42');
      expect(names.certificate).toContain('MySpecialCourse');
      expect(names.certificate).toContain('42');
    });
  });
});
