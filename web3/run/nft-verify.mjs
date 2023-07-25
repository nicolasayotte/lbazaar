import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import verifySignature from "@cardano-foundation/cardano-verify-datasignature";
import { Address,
         textToBytes,
         bytesToHex } from "@hyperionbt/helios";

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

        console.error("args: ", args);

        const buffer = Buffer.from(messageHex, 'hex');
        const message = buffer.toString('utf8');
        const walletAddr = Address.fromHex(walletAddrHex).toBech32();
        const verified = verifySignature(signature, spendingKey, message, walletAddr);
        const date = new Date(); // Create a new Date object with the current date and time

        // Confirm the address that the NFT is residing at and that
        // it is the same address that is owned by the student
        const tokenName = '(222)' + nftName + '|' + serialNum;
        const unit = mph + bytesToHex(textToBytes(tokenName));
        const apiKey = process.env.BLOCKFROST_API_KEY
        const API = new BlockFrostAPI({
            projectId: apiKey
        });
        const assets = await API.assetsAddresses(unit);
        const addr = Address.fromBech32(assets[0].address);

        // Check that both the signed phk and verified stake key hash
        // are correct.
        if (walletAddr !== addr.toBech32()) {
            throw console.error("nft-verify: Address for NFT does not match what wallet provided");
        }
    
        // Double check that address belongs to verified stake key hash
        if (stakeKeyHash !== addr.stakingHash.hex) {
            throw console.error("nft-verify: Stake key hash does not match with verified stake key")
        }

        // Get the individual date and time components
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero if necessary
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        // Create the formatted date string
        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        if (verified) {
            const returnObj = {
                status: 200,
                date: formattedDate
            }
            console.error(returnObj);
            process.stdout.write(JSON.stringify(returnObj));
        } else {
            const returnObj = {
                status: 501
            }
            console.error(returnObj);
            process.stdout.write(JSON.stringify(returnObj));
        }

    } catch (e) {
        console.error("nft-verify: ", e);
    }
}

main();

