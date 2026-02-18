import { Program } from '@hyperionbt/helios';
import fs from 'fs/promises';

const optimize = false;

/**
 * Calculates the minting policy hash for certificate NFTs
 * @returns {Promise<string>} The minting policy hash
 */
export async function calculateMintingPolicyHash() {
  try {
    const ownerPkh = process.env.OWNER_PKH;

    if (!ownerPkh) {
      throw new Error('OWNER_PKH environment variable is required');
    }

    // Load and compile the NFT minting policy
    const nftMintingPolicyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    nftMintingProgram.parameters = { ['VERSION']: '1.0' };

    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    return compiledNftMintingProgram.mintingPolicyHash.hex;
  } catch (error) {
    throw new Error(`Failed to calculate minting policy hash: ${error.message}`);
  }
}

/**
 * Gets the minting policy hash for the current configuration
 * @returns {Promise<string>} The minting policy hash
 */
export async function getMintingPolicyHash() {
  return await calculateMintingPolicyHash();
}
