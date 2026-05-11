import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const flushPromises = () => new Promise(r => setTimeout(r, 0));

// Mock Helios library — mirror the build-purchase-tx test harness.
const mockTx = {
  addInputs: vi.fn().mockReturnThis(),
  addOutput: vi.fn().mockReturnThis(),
  validFrom: vi.fn().mockReturnThis(),
  validTo: vi.fn().mockReturnThis(),
  addSigner: vi.fn().mockReturnThis(),
  addMetadata: vi.fn().mockReturnThis(),
  finalize: vi.fn().mockResolvedValue(undefined),
  toCbor: vi.fn(() => new Uint8Array([0x84, 0xa4, 0x00, 0x81])),
};

const mockAddress = {
  fromHex: vi.fn(() => ({
    stakingHash: { hex: 'test-stake-hash' },
    pubKeyHash: 'test-pub-key-hash',
  })),
  fromBech32: vi.fn((addr) => ({
    stakingHash: { hex: 'test-stake-hash' },
    pubKeyHash: 'test-pub-key-hash',
    toBech32: () => addr,
  })),
};

const mockUTxO = {
  fromCbor: vi.fn(() => ({
    txHash: 'test-tx-hash',
    outputIndex: 0,
    value: { lovelace: 100000000n },
  })),
};

const mockCoinSelection = {
  selectLargestFirst: vi.fn(() => [
    [{ txHash: 'test-tx-hash', outputIndex: 0 }],
    [],
  ]),
};

const mockValue = vi.fn(function (amount) {
  return { lovelace: amount };
});

const mockTxOutput = vi.fn(function (address, value) {
  return { address, value };
});

const mockPubKeyHash = { fromHex: vi.fn(() => 'mock-pub-key-hash') };
const mockNetworkParams = vi.fn(function (params) { return { params }; });

vi.mock('@hyperionbt/helios', () => ({
  Address: mockAddress,
  bytesToHex: vi.fn(() => 'mock-hex-tx'),
  config: { IS_TESTNET: true },
  CoinSelection: mockCoinSelection,
  hexToBytes: vi.fn(() => new Uint8Array([0x00])),
  NetworkParams: mockNetworkParams,
  PubKeyHash: mockPubKeyHash,
  Value: mockValue,
  TxOutput: mockTxOutput,
  Tx: vi.fn(function () { return mockTx; }),
  UTxO: mockUTxO,
}));

const mockSignTx = vi.fn((tx) => ({
  ...tx,
  toCbor: () => new Uint8Array([0x84, 0xa4, 0x00, 0x81]),
}));

const mockGetNetworkParams = vi.fn(async () => JSON.stringify({
  protocolParams: { minFeeA: 44, minFeeB: 155381 },
}));

vi.mock('../../common/sign-tx.mjs', () => ({ signTx: mockSignTx }));
vi.mock('../../common/network.mjs', () => ({ getNetworkParams: mockGetNetworkParams }));

describe('build-feed-tx.mjs', () => {
  const originalArgv = process.argv;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx.addInputs.mockReturnThis();
    mockTx.addOutput.mockReturnThis();
    mockTx.validFrom.mockReturnThis();
    mockTx.validTo.mockReturnThis();
    mockTx.addSigner.mockReturnThis();
    mockTx.addMetadata.mockReturnThis();
    mockTx.finalize.mockResolvedValue(undefined);
    mockTx.toCbor.mockReturnValue(new Uint8Array([0x84, 0xa4, 0x00, 0x81]));
    mockCoinSelection.selectLargestFirst.mockReturnValue([
      [{ txHash: 'test-tx-hash', outputIndex: 0 }],
      [],
    ]);

    process.env = {
      ...originalEnv,
      NETWORK: 'preprod',
      OWNER_PKH: 'owner-pkh-test',
      OWNER_WALLET_ADDR: 'addr_test1owner',
      MIN_ADA: '2000000',
      MAX_TX_FEE: '500000',
      MIN_CHANGE_AMT: '1000000',
    };
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.env = originalEnv;
    vi.resetModules();
  });

  const buildArgv = (lovelace) => [
    'node',
    'build-feed-tx.mjs',
    'test-stake-hash',
    '01abc123',
    'cbor-utxo-1',
    String(lovelace),
  ];

  it('builds a feed tx with the owner wallet output set to the provided lovelace amount', async () => {
    process.argv = buildArgv(50_000_000); // 50 ADA in lovelace
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../build-feed-tx.mjs?t=' + Date.now());
    await flushPromises();

    const response = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(response.status).toBe(200);

    // Owner-wallet output gets the full lovelace value
    const ownerOutputCall = mockTxOutput.mock.calls[0];
    expect(ownerOutputCall[1]).toEqual({ lovelace: 50_000_000n });

    writeSpy.mockRestore();
    errSpy.mockRestore();
  });

  // Regression: PHP previously passed ADA strings like "29.953917". BigInt()
  // cannot parse a decimal point and the script crashed with status 501.
  // The script now expects integer lovelace and PHP rounds before invoking.
  it('accepts an integer lovelace argument without crashing', async () => {
    process.argv = buildArgv(29_953_917); // would have been "29.953917" ADA pre-fix
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../build-feed-tx.mjs?t=' + Date.now());
    await flushPromises();

    const response = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(response.status).toBe(200);
    expect(mockTxOutput.mock.calls[0][1]).toEqual({ lovelace: 29_953_917n });

    writeSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns 501 when the stake key does not match the change address', async () => {
    mockAddress.fromHex.mockReturnValueOnce({
      stakingHash: { hex: 'mismatched-stake-hash' },
      pubKeyHash: 'test-pub-key-hash',
    });

    process.argv = buildArgv(50_000_000);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../build-feed-tx.mjs?t=' + Date.now());
    await flushPromises();

    const response = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(response.status).toBe(501);

    writeSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('returns 501 when coin selection fails (insufficient funds)', async () => {
    mockCoinSelection.selectLargestFirst.mockImplementationOnce(() => {
      throw new Error('Insufficient funds');
    });

    process.argv = buildArgv(50_000_000);
    const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await import('../build-feed-tx.mjs?t=' + Date.now());
    await flushPromises();

    const response = JSON.parse(writeSpy.mock.calls[0][0]);
    expect(response.status).toBe(501);

    writeSpy.mockRestore();
    errSpy.mockRestore();
  });
});
