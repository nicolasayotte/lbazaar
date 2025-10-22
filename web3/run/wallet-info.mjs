import { Address, StakeAddress } from '@hyperionbt/helios';

import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const main = async () => {
  try {
    const apiKey = process.env.BLOCKFROST_API_KEY;

    const API = new BlockFrostAPI({
      projectId: apiKey,
    });

    const args = process.argv;
    const hexChangeAddr = args[2];
    const stakeKeyHashDB = args[3];

    // Get the change address from the wallet
    const changeAddr = Address.fromHex(hexChangeAddr);
    const stakeAddr = StakeAddress.fromAddress(changeAddr);
    const accountInfo = API.accounts(stakeAddr.toBech32());
    const accountAmt = (await accountInfo).controlled_amount;
    const date = new Date().toISOString().substring(0, 19).replace('T', ' ');

    const returnObj = {
      status: 200,
      accountAmt: accountAmt,
      stakeKeyAddr: stakeAddr.toHex(),
      stakeAddrBech32: stakeAddr.toBech32(),
      stakeKeyHash: stakeAddr.stakingHash.hex,
      verified: stakeAddr.stakingHash.hex === stakeKeyHashDB,
      date,
    };
    console.error(returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  } catch (e) {
    console.error('wallet-info: ', e);
  }
};

main();
