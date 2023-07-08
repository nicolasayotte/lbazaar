import { Address,
         bytesToHex,
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
        const stakeKeyHashDB = args[3];

        // Get the change address from the wallet
        const changeAddr = Address.fromHex(hexChangeAddr);
        //const stakeHash = changeAddr.stakingHash;
        //const stakeAddr = Address.fromPubKeyHash(stakeHash);
        const stakeAddr = StakeAddress.fromAddress(changeAddr);
        const accountInfo = API.accounts(stakeAddr.toBech32());
        const accountAmt = (await accountInfo).controlled_amount;
        const date = new Date(); // Create a new Date object with the current date and time

        // Get the individual date and time components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero if necessary
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        // Create the formatted date string
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        const returnObj = {
            status: 200,
            accountAmt: accountAmt,
            //stakeKeyHash: bytesToHex(stakeAddr.bytes),
            stakeKeyAddr: stakeAddr.toHex(),
            stakeAddrBech32: stakeAddr.toBech32(),
            stakeKeyHash: stakeAddr.stakingHash.hex,
            verified: stakeAddr.stakingHash.hex === stakeKeyHashDB,
            date: formattedDate
        }
        console.error(returnObj);
        process.stdout.write(JSON.stringify(returnObj));

        

    } catch (e) {
        console.error("wallet-info: ", e);
    }
}

main();

