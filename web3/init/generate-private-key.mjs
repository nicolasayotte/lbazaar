import { Buffer } from 'buffer';
import { generateMnemonic, mnemonicToEntropy } from 'bip39';
import { Address, RootPrivateKey } from '@hyperionbt/helios';

const isTestnet = process.env.NETWORK !== "mainnet"

/**
 * Generates:
 *  - ENTROPY           : mnemonic phrase (24 words)
 *  - OWNER_PKH         : blake2b-224 hash of the first external pubkey
 *  - OWNER_WALLET_ADDR : enterprise (no-stake) Bech32 address
 *
 * Usage:
 *   ENTROPY="your twenty-four-word mnemonic here" node generate-private-key.mjs
 */
async function main(mnemonic) {
    // Always use a valid 24-word mnemonic if none provided
    if (!mnemonic || mnemonic.trim() === '') {
        const envMnemonic = process.env.ENTROPY;
        if (envMnemonic && envMnemonic.trim() !== '') {
            mnemonic = envMnemonic.trim();
        } else {
            mnemonic = generateMnemonic(256); // 24 words
        }
    }
    // Validate mnemonic
    const words = mnemonic.trim().split(/\s+/);
    if (![12, 15, 18, 21, 24].includes(words.length)) {
        throw new Error(`Mnemonic must be 12, 15, 18, 21, or 24 words ${mnemonic}`);
    }
    const entropy = mnemonicToEntropy(mnemonic);

    const entropyBytes = Array.from(Buffer.from(entropy, 'hex'));
    const rootKey = new RootPrivateKey(entropyBytes);

    const paymentHash = rootKey.deriveSpendingKey(0, 0).derivePubKey().pubKeyHash;
    const enterpriseAddr = Address.fromHash(paymentHash, isTestnet).toBech32();
    return {
        ENTROPY: mnemonic,
        OWNER_PKH: paymentHash.hex,
        OWNER_WALLET_ADDR: enterpriseAddr,
    }
}
main().then((res) => Object.entries(res).forEach(([key, val]) => console.log(`${key}=${val}`)))
