import { promises as fs } from 'fs';
import { Program } from '@hyperionbt/helios';

/**
 * Main calling function via the command line
 * Usage: node get-mph.mjs
 * @output {string} mph
 */
const main = async () => {
  try {
    // Set the Helios compiler optimizer flag
    const optimize = process.env.OPTIMIZE === 'true';
    const ownerPkh = process.env.OWNER_PKH;
    const lockDate = process.env.CERTIFICATE_LOCK_DATE;
    if (!lockDate) {
      throw new Error('CERTIFICATE_LOCK_DATE env var required');
    }
    const lockTimestamp = new Date(lockDate).getTime();
    if (isNaN(lockTimestamp)) {
      throw new Error('Invalid CERTIFICATE_LOCK_DATE format');
    }

    const nftMintingPolicyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);
    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    nftMintingProgram.parameters = { ['LOCK_DATE']: BigInt(lockTimestamp) };
    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;

    const returnObj = {
      status: 200,
      mph: nftTokenMPH.hex,
    };
    console.error('get-mph.msj: returnObj: ', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  } catch (err) {
    const timestamp = new Date().toISOString();
    const returnObj = {
      status: 500,
      date: timestamp,
      error: err,
    };
    console.error('get-mph.mjs: returnObj: ', returnObj);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
