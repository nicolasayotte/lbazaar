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
    const isMulti = this.script.includes('multi');
    return {
      mintingPolicyHash: {
        hex: isMulti ? 'multi-hash' : 'single-hash',
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
    delete process.env.NMKR_PKH;
    mockReadFile.mockImplementation(async (path) =>
      path.includes('multi') ? 'multi-policy-script' : 'single-policy-script',
    );
  });

  afterEach(() => {
    delete process.env.OWNER_PKH;
    delete process.env.NMKR_PKH;
  });

  it('calculateMintingPolicyHash uses single-signature policy when NMKR_PKH absent', async () => {
    const module = await import('../minting-policy.mjs');
    const result = await module.calculateMintingPolicyHash(false);

    expect(mockReadFile).toHaveBeenCalledWith('./contracts/nft-minting-policy.hl', 'utf8');
    expect(programNewSpy).toHaveBeenCalledWith('single-policy-script');
    expect(result).toBe('single-hash');
  });

  it('calculateMintingPolicyHash uses multi-signature policy when requested', async () => {
    process.env.NMKR_PKH = 'nmkr-hash';
    const module = await import('../minting-policy.mjs');
    const result = await module.calculateMintingPolicyHash(true);

    expect(mockReadFile).toHaveBeenCalledWith('./contracts/nft-minting-policy-multi-sig.hl', 'utf8');
    expect(programNewSpy).toHaveBeenCalledWith('multi-policy-script');
    expect(result).toBe('multi-hash');
  });

  it('shouldUseMultiSigPolicy reflects NMKR_PKH presence', async () => {
    const module = await import('../minting-policy.mjs');
    expect(module.shouldUseMultiSigPolicy()).toBe(false);
    process.env.NMKR_PKH = 'nmkr-hash';
    expect(module.shouldUseMultiSigPolicy()).toBe(true);
  });

  it('getMintingPolicyHash returns correct hash based on multi-sig flag', async () => {
    const module = await import('../minting-policy.mjs');

    const singleHash = await module.getMintingPolicyHash();
    expect(singleHash).toBe('single-hash');

    process.env.NMKR_PKH = 'nmkr-hash';
    const multiHash = await module.getMintingPolicyHash();
    expect(multiHash).toBe('multi-hash');
  });
});
