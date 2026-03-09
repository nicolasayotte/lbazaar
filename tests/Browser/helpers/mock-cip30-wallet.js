// @ts-check

/**
 * Mock CIP-30 wallet injected via page.addInitScript().
 *
 * Provides window.cardano.eternl with the same interface a real
 * Eternl browser-extension would expose (CIP-30 dApp connector).
 *
 * All hex values below are deterministic test fixtures — they do NOT
 * correspond to real funds on any Cardano network.
 */

// ── Test fixtures ────────────────────────────────────────────────────
// A valid-looking testnet address (hex-encoded).  The WalletConnector
// sends this to POST /wallet/info.
const CHANGE_ADDRESS_HEX =
    '00' +                                                  // header byte (base address, testnet)
    'e8c300cb1d7b1d4dc348a4133e5c5c86ab0600c2274bde54e4' + // payment key hash (28 bytes)
    'b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c'; // stake key hash (28 bytes)

// Stake address (hex-encoded, testnet).  Used for signData verification.
const STAKE_ADDRESS_HEX =
    'e0' +                                                  // header byte (reward address, testnet)
    'b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c'; // same stake key hash

// Stake key hash (raw 28-byte hex) — matches the tail of the addresses above.
const STAKE_KEY_HASH = 'b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c';

// A dummy signature returned by signData (84-byte COSE_Sign1 placeholder).
const MOCK_SIGNATURE = 'a0'.repeat(64);

// A dummy COSE key returned as signData().key.
const MOCK_COSE_KEY = 'b0'.repeat(32);

// CBOR-encoded balance (simple integer 50 000 000 lovelace = 50 ADA).
// 1a 02faf080 = uint32(50000000)
const BALANCE_CBOR = '1a02faf080';

// A single dummy UTXO (CBOR hex) — enough for the HW wallet flow.
const MOCK_UTXO_CBOR = '82' +       // array(2): [tx-input, tx-output]
    '8258200000000000000000000000000000000000000000000000000000000000000000' + // tx-input: [txid(32), 0]
    '00' +
    '82' +                           // tx-output: [address, value]
    '5839' + CHANGE_ADDRESS_HEX +    // address bytes
    '1a02faf080';                    // 50 000 000 lovelace

// A dummy witness set returned by signTx.
const MOCK_WITNESS = 'a0'.repeat(32);

// ── Event emitter (experimental CIP-30) ──────────────────────────────
const listeners = {};

const experimental = {
    on(event, cb) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
    },
    off(event, cb) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter((fn) => fn !== cb);
    },
    emit(event, ...args) {
        (listeners[event] || []).forEach((fn) => fn(...args));
    },
};

// ── Full CIP-30 API (returned by .enable()) ─────────────────────────
const walletAPI = {
    getNetworkId:      async () => 0,                      // 0 = testnet/preprod
    getBalance:        async () => BALANCE_CBOR,
    getChangeAddress:  async () => CHANGE_ADDRESS_HEX,
    getRewardAddresses: async () => [STAKE_ADDRESS_HEX],
    getUsedAddresses:  async () => [CHANGE_ADDRESS_HEX],
    getUnusedAddresses: async () => [],
    getUtxos:          async () => [MOCK_UTXO_CBOR],
    getCollateral:     async () => [],
    signData:          async (_addr, _payload) => ({
        signature: MOCK_SIGNATURE,
        key: MOCK_COSE_KEY,
    }),
    signTx:            async (_cbor, _partial) => MOCK_WITNESS,
    submitTx:          async (_cbor) => '0000000000000000000000000000000000000000000000000000000000000000',
    experimental,
};

// ── Inject window.cardano.eternl ─────────────────────────────────────
window.cardano = window.cardano || {};

window.cardano.eternl = {
    name: 'Eternl',
    icon: 'data:image/png;base64,iVBORw0KGgo=', // tiny placeholder
    apiVersion: '0.1.0',
    enable: async () => walletAPI,
    isEnabled: async () => true,
};

