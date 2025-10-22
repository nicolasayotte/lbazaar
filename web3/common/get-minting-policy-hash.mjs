#!/usr/bin/env node

import { getMintingPolicyHash, shouldUseMultiSigPolicy } from '../common/minting-policy.mjs';

/**
 * Utility to get the minting policy hash for certificate NFTs
 * Usage: node get-minting-policy-hash.mjs
 * Output: JSON with minting policy hash and configuration info
 */
const main = async () => {
  try {
    const useMultiSig = shouldUseMultiSigPolicy();
    const policyHash = await getMintingPolicyHash();

    const result = {
      status: 200,
      mintingPolicyHash: policyHash,
      policyType: useMultiSig ? 'multi-signature' : 'single-signature',
      description: useMultiSig
        ? 'Multi-signature policy allowing minting by either owner or NMKR'
        : 'Single-signature policy requiring owner signature',
      configuration: {
        ownerPkh: process.env.OWNER_PKH || null,
        nmkrPkh: process.env.NMKR_PKH || null,
        network: process.env.NETWORK || 'preprod'
      }
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    const result = {
      status: 500,
      error: error.message
    };
    console.error(JSON.stringify(result, null, 2));
    process.exit(1);
  }
};

main();
