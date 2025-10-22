import verifySignature from '@cardano-foundation/cardano-verify-datasignature';
import { StakeAddress } from '@hyperionbt/helios';

const main = async () => {
  try {
    const args = process.argv;
    const signature = args[2];
    const stakeKey = args[3];
    const messageHex = args[4];
    const stakeAddr = args[5];

    console.error('args: ', args);

    const buffer = Buffer.from(messageHex, 'hex');
    const message = buffer.toString('utf8');
    const verified = verifySignature(signature, stakeKey, message, stakeAddr);
    const stakeKeyHash = StakeAddress.fromBech32(stakeAddr).stakingHash;
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
    console.error('wallet-verify: ', e);
  }
};

main();
