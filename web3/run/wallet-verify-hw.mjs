import { hexToBytes, StakeAddress, Tx, TxWitnesses } from '@hyperionbt/helios';

const main = async () => {
  try {
    const args = process.argv;
    const cborSig = args[2];
    const cborTx = args[3];
    const stakeAddr = args[4];

    console.error('wallet-verify-hw-args: ', args);

    const tx = Tx.fromCbor(hexToBytes(cborTx));

    // Add signature from the users wallet
    const signatures = TxWitnesses.fromCbor(hexToBytes(cborSig)).signatures;
    const stakeKeyHash = StakeAddress.fromBech32(stakeAddr).stakingHash;

    let verified = false;
    for (const sig of signatures) {
      console.error('verifying sig.pubKeyHash.hex', sig.pubKeyHash.hex);
      sig.verify(tx.bodyHash);
      if (stakeKeyHash.hex === sig.pubKeyHash.hex) {
        console.error('stake key match found');
        verified = true;
      }
    }

    const date = new Date().toISOString().substring(0, 19).replace('T', ' ');

    if (verified) {
      const returnObj = {
        status: 200,
        stakeKeyHash: stakeKeyHash.hex,
        date,
      };
      console.error(returnObj);
      process.stdout.write(JSON.stringify(returnObj));
    } else {
      const returnObj = {
        status: 501,
      };
      console.error(returnObj);
      process.stdout.write(JSON.stringify(returnObj));
    }
  } catch (e) {
    console.error('wallet-verify-hw: ', e);
  }
};

main();
