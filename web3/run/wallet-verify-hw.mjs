import { hexToBytes, StakeAddress, Tx, TxWitnesses } from "@hyperionbt/helios";

const main = async () => {

    try {
        const args = process.argv;
        const cborSig = args[2];
        const cborTx = args[3];
        const stakeAddr = args[4];

        console.error("wallet-verify-hw-args: ", args);

        const tx = Tx.fromCbor(hexToBytes(cborTx));

        // Add signature from the users wallet
        const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
        const stakeKeyHash = StakeAddress.fromBech32(stakeAddr).stakingHash;
        
        let verified = false;
        for (const sig of signatures) {
            console.error("verifying sig.pubKeyHash.hex", sig.pubKeyHash.hex);
            sig.verify(tx.bodyHash);
            if (stakeKeyHash.hex == sig.pubKeyHash.hex) {
                console.error("stake key match found");
                verified = true;
            }
          }

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
        console.error("wallet-verify-hw: ", e);
    }
}

main();

