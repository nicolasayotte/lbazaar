import { Address, StakeAddress } from '@hyperionbt/helios';

import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const apiKey = process.env.BLOCKFROST_API_KEY;

const API = new BlockFrostAPI({
    projectId: apiKey,
});

const main = async () => {
    try {
        const [, , walletAddr] = process.argv;

        const addressInfo = await API.addresses(walletAddr);
        const amount = addressInfo.amount;
        const date = new Date().toISOString().substring(0, 19).replace('T', ' ');

        const result = {
            status: 200,
            amount: amount,
            date,
        };
        console.error(result);
        process.stdout.write(JSON.stringify(result));
    } catch (e) {
        console.error('wallet-info: ', e);
    }
};

main();
