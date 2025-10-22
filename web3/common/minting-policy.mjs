import { Program } from '@hyperionbt/helios';
import fs from 'fs/promises';

const optimize = false;

/**
 * Calculates the minting policy hash for certificate NFTs
 * @param {boolean} useMultiSig - Whether to use the multi-signature policy
 * @returns {Promise<string>} The minting policy hash
 */
export async function calculateMintingPolicyHash(useMultiSig = false) {
  try {
    const ownerPkh = process.env.OWNER_PKH;
    const nmkrPkh = process.env.NMKR_PKH || ownerPkh;

    if (!ownerPkh) {
      throw new Error('OWNER_PKH environment variable is required');
    }

    if (useMultiSig && !process.env.NMKR_PKH) {
      throw new Error('NMKR_PKH environment variable is required for multi-sig policy');
    }

    // Load and compile the NFT minting policy
    const policyFileName = useMultiSig ? 'nft-minting-policy-multi-sig.hl' : 'nft-minting-policy.hl';
    const nftMintingPolicyFile = await fs.readFile(`./contracts/${policyFileName}`, 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    if (useMultiSig) {
      nftMintingProgram.parameters = { ['NMKR_PKH']: nmkrPkh };
    }
    nftMintingProgram.parameters = { ['VERSION']: '1.0' };

    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    return compiledNftMintingProgram.mintingPolicyHash.hex;
  } catch (error) {
    throw new Error(`Failed to calculate minting policy hash: ${error.message}`);
  }
}

/**
 * Determines which minting policy to use based on environment variables
 * @returns {boolean} True if multi-sig policy should be used
 */
export function shouldUseMultiSigPolicy() {
  return !!process.env.NMKR_PKH;
}

/**
 * Gets the appropriate minting policy hash for the current configuration
 * @returns {Promise<string>} The minting policy hash
 */
export async function getMintingPolicyHash() {
  const useMultiSig = shouldUseMultiSigPolicy();
  return await calculateMintingPolicyHash(useMultiSig);
}
