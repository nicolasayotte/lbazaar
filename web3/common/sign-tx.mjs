import { Buffer } from 'buffer';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { RootPrivateKey, Address, Tx } from '@hyperionbt/helios';

export { getAccountAddr, signTx, submitTx };

const isTestnet = process.env.NETWORK !== "mainnet"
const client = new BlockFrostAPI({
    projectId: process.env.BLOCKFROST_API_KEY,
});

/**
 * Derive the first address of a rootKey
 * @param {number} accountId
 * @returns {string} bech32Address
 */
const getAccountAddr = async (accountId = 0) => {
    try {
        const rootKey = new RootPrivateKey(Array.from(Buffer.from(process.env.ROOT_KEY, 'hex')))
        const paymentHash = rootKey.deriveSpendingKey(accountId, 0).derivePubKey().pubKeyHash
        const bech32Addr = Address.fromHash(paymentHash, isTestnet).toBech32();
        return bech32Addr
    } catch (err) {
        throw console.error('get-addr: ', err);
    }
};

/**
 * Sign the tx with a private key
 * @param {Tx} tx
 * @returns {Tx} tx
 */
const signTx = async (tx, accountId = 0) => {
    try {
        const rootKey = new RootPrivateKey(Array.from(Buffer.from(process.env.ROOT_KEY, 'hex')))
        const spendingKey = rootKey.deriveSpendingKey(accountId)
        const bodyHash = Crypto.blake2b(tx.body.toCbor(), 32);  // 32-byte digest
        const signature = spendingKey.sign(bodyHash)

        tx.addSignature(signature);
        return tx;
    } catch (err) {
        throw console.error('sign-tx: ', err);
    }
};

/**
 * Submit a Helios Tx to blockfrost and return the
 * txHash if successful.
 * @param {Tx} tx
 * @returns {string} txId
 */

const submitTx = async (tx) => {
    try {
        const payload = new Uint8Array(tx.toCbor());
        const txHash = await client.txSubmit(payload);
        return txHash;
    } catch (err) {
        throw err;
    }
};
