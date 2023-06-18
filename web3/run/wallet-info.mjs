import { Address,
         StakeAddress } from "@hyperionbt/helios";

import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const main = async () => {

    try {

        const apiKey = process.env.BLOCKFROST_API_KEY;
    
        const API = new BlockFrostAPI({
            projectId: apiKey
        });

        const args = process.argv;
        const hexChangeAddr = args[2];

        // Get the change address from the wallet
        const changeAddr = Address.fromHex(hexChangeAddr);
        //const stakeHash = changeAddr.stakingHash;
        //const stakeAddr = Address.fromPubKeyHash(stakeHash);
        const stakeAddr = StakeAddress.fromAddress(changeAddr);
        const accountInfo = API.accounts(stakeAddr.toBech32());
        const accountAmt = (await accountInfo).controlled_amount;

        console.log(accountAmt);

    } catch (e) {
        console.error("wallet-info: ", e);
    }
}

main();

