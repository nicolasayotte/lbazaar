import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { RootPrivateKey, Address, Tx } from '@hyperionbt/helios';

export { getAccountAddr, signTx, submitTx };

const isTestnet = process.env.NETWORK !== "mainnet"
let _client;
const getClient = () => {
    if (!_client) {
        _client = new BlockFrostAPI({ projectId: process.env.BLOCKFROST_API_KEY });
    }
    return _client;
};

const defaultEntropy = 'kiss smile exotic pigeon jealous inmate bomb unit pelican tissue viable immense demand flee equal always decrease advance swallow stock replace list enhance item';

const validEntropy = process.env.ENTROPY ? process.env.ENTROPY.trim() : false;
if (!validEntropy) {
    console.warn('No ENTROPY set, using default entropy');
    if (process.env.NODE_ENV === 'production') {
        throw new Error('No ENTROPY set, please set it in your environment variables');
    }
} else {
    console.warn('Using custom ENTROPY from environment variables');
}
const entropy = (validEntropy || defaultEntropy).split(' ')

/**
 * Derive the first address of a rootKey
 * @param {number} accountId
 * @returns {string} bech32Address
 */
const getAccountAddr = async (accountId = 0) => {
    try {
        const rootKey = RootPrivateKey.fromPhrase(entropy)
        const paymentHash = rootKey.deriveSpendingKey(accountId, 0).derivePubKey().pubKeyHash;
        const bech32Addr = Address.fromHash(paymentHash, isTestnet).toBech32();
        return bech32Addr;
    } catch (err) {
        console.error('get-addr: ', err);
        throw err;
    }
};

/**
 * Sign the tx with a private key
 * @param {Tx} tx
 * @returns {Tx} tx
 */
const signTx = async (tx, accountId = 0) => {
    try {
        const rootKey = RootPrivateKey.fromPhrase(entropy)
        const spendingKey = rootKey.deriveSpendingKey(accountId);
        const signature = spendingKey.sign(tx.bodyHash);

        tx.addSignature(signature, false);
        return tx;
    } catch (err) {
        console.error('sign-tx: ', err);
        throw err;
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
        const txHash = await getClient().txSubmit(payload);
        return txHash;
    } catch (err) {
        throw err;
    }
};
