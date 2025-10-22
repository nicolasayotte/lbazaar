import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import verifySignature from '@cardano-foundation/cardano-verify-datasignature';
import { Address, textToBytes, bytesToHex } from '@hyperionbt/helios';

const main = async () => {
    try {
        const args = process.argv;

        const signature = args[2];
        const spendingKey = args[3];
        const messageHex = args[4];
        const walletAddrHex = args[5];
        const nftName = args[6];
        const mph = args[7];
        const serialNum = args[8];
        const stakeKeyHash = args[9];
        console.error('args: ', args);

        const buffer = Buffer.from(messageHex, 'hex');
        const message = buffer.toString('utf8');
        const walletAddr = Address.fromHex(walletAddrHex).toBech32();
        const verified = verifySignature(signature, spendingKey, message, walletAddr);

        // Confirm the address that the NFT is residing at and that
        // it is the same address that is owned by the student
        const tokenName = '(222)' + nftName + '|' + serialNum;
        const unit = mph + bytesToHex(textToBytes(tokenName));
        const apiKey = process.env.BLOCKFROST_API_KEY;
        const API = new BlockFrostAPI({ projectId: apiKey });
        const assets = await API.assetsAddresses(unit);
        const addr = Address.fromBech32(assets[0].address);

        // Check that both the signed pkh and verified stake key hash
        // are correct.
        if (walletAddr !== addr.toBech32()) {
            throw console.error('nft-verify: Address for NFT does not match what wallet provided');
        }

        // Double check that address belongs to verified stake key hash
        if (stakeKeyHash !== addr.stakingHash.hex) {
            throw console.error('nft-verify: Stake key hash does not match with verified stake key');
        }

        const date = new Date().toISOString().substring(0, 19).replace('T', ' ');

        const returnObj = verified ? { status: 200, date } : { status: 501 };
        console.error(returnObj);
        process.stdout.write(JSON.stringify(returnObj));
    } catch (e) {
        console.error('nft-verify: ', e);
    }
};

main();
