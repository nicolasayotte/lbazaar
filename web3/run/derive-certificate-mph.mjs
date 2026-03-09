import { Program } from '@hyperionbt/helios';
import fs from 'fs/promises';

/**
 * Derive the certificate minting policy hash from the lock date.
 *
 * Usage: node derive-certificate-mph.mjs [lockDate]
 *
 * lockDate defaults to CERTIFICATE_LOCK_DATE env var.
 * Outputs JSON: { "status": 200, "mph": "<hex>" }
 */
const main = async () => {
  try {
    const lockDate = process.argv[2] || process.env.CERTIFICATE_LOCK_DATE;
    const ownerPkh = process.env.OWNER_PKH;

    if (!lockDate) {
      throw new Error('CERTIFICATE_LOCK_DATE env var or argument required');
    }
    if (!ownerPkh) {
      throw new Error('OWNER_PKH env var required');
    }

    const lockTimestamp = new Date(lockDate).getTime();
    if (isNaN(lockTimestamp)) {
      throw new Error('Invalid lock date format. Use ISO 8601 (e.g. 2026-12-31T23:59:59Z)');
    }

    const policySource = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
    const program = Program.new(policySource);

    program.parameters = { ['OWNER_PKH']: ownerPkh };
    program.parameters = { ['LOCK_DATE']: BigInt(lockTimestamp) };

    const compiled = program.compile(false);
    const mph = compiled.mintingPolicyHash.hex;

    const result = { status: 200, mph };
    process.stdout.write(JSON.stringify(result));
  } catch (err) {
    const result = { status: 500, error: err.message || String(err) };
    console.error('derive-certificate-mph: error', err);
    process.stdout.write(JSON.stringify(result));
  }
};

main();
