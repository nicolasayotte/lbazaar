import { Buffer } from 'buffer';
import { generateMnemonic, mnemonicToEntropy } from 'bip39';
import { Address, bytesToHex, RootPrivateKey } from '@hyperionbt/helios';

const isTestnet = process.env.NETWORK !== "mainnet"

/**
 * Generates:
 *  - ROOT_KEY   : hex of the m/1852'/1815' root private key
 *  - OWNER_PKH  : blake2b-224 hash of the first external pubkey
 *  - ADDRESS    : enterprise (no-stake) mainnet Bech32 address
 *
 * Usage:
 *   ENTROPY="your twelve-word mnemonic here" node generate-address.js
 */
async function main(mnemonic) {
    mnemonic ??= process.env.ENTROPY ?? generateMnemonic(256)
    const entropy = mnemonicToEntropy(mnemonic);

    const entropyBytes = Array.from(Buffer.from(entropy, 'hex'));
    const rootKey = new RootPrivateKey(entropyBytes);

    const rootKeyHex = bytesToHex(rootKey.bytes);
    const paymentHash = rootKey.deriveSpendingKey(0, 0).derivePubKey().pubKeyHash;
    const enterpriseAddr = Address.fromHash(paymentHash, isTestnet).toBech32()
    return {
        ENTROPY: mnemonic,
        ROOT_KEY: rootKeyHex,
        OWNER_PKH: paymentHash.hex,
        ADDRESS: enterpriseAddr,
    }
}
main().then((res) => Object.entries(res).forEach(([key, val]) => console.log(`${key}=${val}`)))
