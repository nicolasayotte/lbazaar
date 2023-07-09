import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { Address,
         hexToBytes,
         textToBytes,
         bytesToHex, 
         TxWitnesses,
         Tx} from "@hyperionbt/helios";

const main = async () => {

    try {
        const args = process.argv;
        const cborSig = args[2];
        const cborTx = args[3];
        const walletAddr = args[4];
        const nftName = args[5];
        const mph = args[6];
        const serialNum = args[7];
        const stakeKeyHash = args[8];

        console.error("nft-verify-hw: args: ", args);

        const tx = Tx.fromCbor(hexToBytes(cborTx));

        // Add signatures from the user's wallet
        const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
        const pubKeyHash = Address.fromHex(walletAddr).pubKeyHash;
        
        let verified = false;
        for (const sig of signatures) {
            console.error("verifying sig.pubKeyHash.hex", sig.pubKeyHash.hex);
            sig.verify(tx.bodyHash);
            if (pubKeyHash.hex == sig.pubKeyHash.hex) {
                console.error("pub key match found");
                verified = true;
            }
          }

        // Confirm the address that the NFT is residing at and that
        // it is the same address that is owned by the student
        const tokenName = nftName + '|' + serialNum;
        const unit = mph + bytesToHex(textToBytes(tokenName));
        const apiKey = process.env.BLOCKFROST_API_KEY
        const API = new BlockFrostAPI({
            projectId: apiKey
        });
        const assets = await API.assetsAddresses(unit);
        const addr = Address.fromBech32(assets[0].address);

        // Check that both the signed phk and verified stake key hash
        // are correct.
        if (walletAddr !== addr.toHex()) {
            throw console.error("nft-verify-hw: Address for NFT does not match what wallet provided");
        }
       
        // Double check that address belongs to verified stake key hash
        if (stakeKeyHash !== addr.stakingHash.hex) {
            throw console.error("nft-verify-hw: Stake key hash does not match with verified stake key")
        }

        // Get the individual date and time components
        const date = new Date(); // Create a new Date object with the current date and time
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
        console.error("nft-verify-hw: ", e);
    }
}

main();

