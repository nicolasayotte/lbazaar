import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockReadFile = vi.fn();

class ProgramMock {
  constructor(script) {
    this.script = script;
    this._parameters = {};
  }

  set parameters(value) {
    this._parameters = { ...this._parameters, ...value };
  }

  get parameters() {
    return this._parameters;
  }

  compile() {
    return {
      mintingPolicyHash: {
        hex: 'single-hash',
      },
    };
  }
}

const programNewSpy = vi.fn((script) => new ProgramMock(script));

vi.mock('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
  },
}));

vi.mock('@hyperionbt/helios', () => ({
  Program: {
    new: programNewSpy,
  },
}));

describe('minting-policy helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.OWNER_PKH = 'owner-hash';
    process.env.CERTIFICATE_LOCK_DATE = '2099-12-31T23:59:59Z';
    mockReadFile.mockResolvedValue('single-policy-script');
  });

  afterEach(() => {
    delete process.env.OWNER_PKH;
    delete process.env.CERTIFICATE_LOCK_DATE;
  });

  it('calculateMintingPolicyHash uses single-signature policy', async () => {
    const module = await import('../minting-policy.mjs');
    const result = await module.calculateMintingPolicyHash();

    expect(mockReadFile).toHaveBeenCalledWith('./contracts/nft-minting-policy.hl', 'utf8');
    expect(programNewSpy).toHaveBeenCalledWith('single-policy-script');
    expect(result).toBe('single-hash');
  });

  it('calculateMintingPolicyHash throws when OWNER_PKH is missing', async () => {
    delete process.env.OWNER_PKH;
    const module = await import('../minting-policy.mjs');

    await expect(module.calculateMintingPolicyHash()).rejects.toThrow('OWNER_PKH environment variable is required');
  });

  it('calculateMintingPolicyHash throws when CERTIFICATE_LOCK_DATE is missing', async () => {
    delete process.env.CERTIFICATE_LOCK_DATE;
    const module = await import('../minting-policy.mjs');

    await expect(module.calculateMintingPolicyHash()).rejects.toThrow('CERTIFICATE_LOCK_DATE environment variable is required');
  });

  it('getMintingPolicyHash returns the single-signature hash', async () => {
    const module = await import('../minting-policy.mjs');

    const hash = await module.getMintingPolicyHash();
    expect(hash).toBe('single-hash');
  });
});
