import { Program } from '@hyperionbt/helios';
import fs from 'fs/promises';

const optimize = false;

// F-05: Certificate NFTs are soul-bound (non-tradeable/non-transferable).
// The on-chain enforcement is in web3/contracts/nft-minting-policy.hl.
// This flag documents the constraint at the JS wrapper layer and must remain true.
// See also: certificate-metadata.mjs which sets non_transferable = true in CIP-25 metadata.
export const SOUL_BOUND = true;

/**
 * Calculates the minting policy hash for certificate NFTs
 * @returns {Promise<string>} The minting policy hash
 */
export async function calculateMintingPolicyHash() {
  try {
    const ownerPkh = process.env.OWNER_PKH;
    const lockDate = process.env.CERTIFICATE_LOCK_DATE;

    if (!ownerPkh) {
      throw new Error('OWNER_PKH environment variable is required');
    }
    if (!lockDate) {
      throw new Error('CERTIFICATE_LOCK_DATE environment variable is required');
    }
    const lockTimestamp = new Date(lockDate).getTime();
    if (isNaN(lockTimestamp)) {
      throw new Error('Invalid CERTIFICATE_LOCK_DATE format');
    }

    // Load and compile the NFT minting policy
    const nftMintingPolicyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    nftMintingProgram.parameters = { ['LOCK_DATE']: BigInt(lockTimestamp) };

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
