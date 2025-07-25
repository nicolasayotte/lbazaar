import { getAccountAddr } from './sign-tx.mjs';

/**
 * Main function to get custodial wallet address from user ID
 * Usage: node get-custodial-address.mjs userId
 * @params {number}
 * @output {string} JSON response with address
 */
const main = async () => {
  try {
    const args = process.argv;
    const userId = parseInt(args[2]);

    if (!userId || isNaN(userId)) {
      throw new Error('Invalid user ID provided');
    }

    // Use the user ID as the account ID for address derivation
    const address = await getAccountAddr(userId);

    const returnObj = {
      status: 200,
      address: address,
      userId: userId
    };

    console.error('get-custodial-address: success for user', userId);
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err
    };
    console.error('get-custodial-address: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
