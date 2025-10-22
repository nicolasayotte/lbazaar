import { verifyWebhookSignature } from '@blockfrost/blockfrost-js';

/**
 * Main calling function via the command line
 * Usage: node blockfrost-verify signature requestBody
 * @params {string, string, string[]}
 * @output {string} cborTx
 */
const main = async () => {
  const args = process.argv;
  console.error('blockfrost-verify: args: ', args);
  const signature = args[2].replace(/\"/g, '');
  const requestBody = args[3];
  const webhook = args[4];

  // You will find your webhook secret auth token in your webhook settings in the Blockfrost Dashboard
  const SECRET_AUTH_TOKEN =
    webhook === 'feed' ? process.env.FEED_WEBHOOK_AUTH_TOKEN : process.env.EXCHANGE_WEBHOOK_AUTH_TOKEN;
  console.error('SECRET_AUTH_TOKEN: ', SECRET_AUTH_TOKEN);

  // Validate the webhook signature
  try {
    verifyWebhookSignature(
      requestBody, // Stringified request.body
      signature,
      SECRET_AUTH_TOKEN,
      6000, // Optional param to customize maximum allowed age of the webhook event, defaults to 600s
    );
    const returnObj = {
      status: 200,
    };
    console.error('blockfrost-verify: OK');
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const returnObj = {
      status: 500,
    };
    var timestamp = new Date().toISOString();
    console.error(timestamp);
    console.error('blockfrost-verify.mjs: ', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
