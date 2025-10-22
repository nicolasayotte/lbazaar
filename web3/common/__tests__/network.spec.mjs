import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockReadFile = vi.fn();

vi.mock('fs', () => ({
  promises: {
    readFile: mockReadFile,
  },
}));

describe('network utilities', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockReadFile.mockResolvedValue('{"linearFee": {"constant": 1}}');
    globalThis.getParamsFile = vi.fn(() => '/mock/config.json');
  });

  it('returns network parameters for allowed network', async () => {
    const { getNetworkParams } = await import('../network.mjs');
    const result = await getNetworkParams('preprod');

    expect(globalThis.getParamsFile).toHaveBeenCalledWith('./config/preprod.json');
    expect(mockReadFile).toHaveBeenCalledWith('/mock/config.json', 'utf8');
    expect(result).toBe('{"linearFee": {"constant": 1}}');
  });

  it('throws when network is invalid', async () => {
    const { getNetworkParams } = await import('../network.mjs');
    await expect(getNetworkParams('invalidnet')).rejects.toThrow('network not set or invalid');
  });
});
