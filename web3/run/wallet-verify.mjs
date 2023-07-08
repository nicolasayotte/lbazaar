import verifySignature from "@cardano-foundation/cardano-verify-datasignature";
import { StakeAddress } from "@hyperionbt/helios";

const main = async () => {

    try {
        const args = process.argv;
        const signature = args[2];
        const stakeKey = args[3];
        const messageHex = args[4];
        const stakeAddr = args[5];

        console.error("args: ", args);

        const buffer = Buffer.from(messageHex, 'hex');
        const message = buffer.toString('utf8');
        console.error("message: ", message);

        const verified = verifySignature(signature, stakeKey, message, stakeAddr);
        const stakeKeyHash = StakeAddress.fromBech32(stakeAddr).stakingHash;
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

        if (verified) {
            const returnObj = {
                status: 200,
                stakeKeyHash: stakeKeyHash.hex,
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
        console.error("wallet-verify: ", e);
    }
}

main();

