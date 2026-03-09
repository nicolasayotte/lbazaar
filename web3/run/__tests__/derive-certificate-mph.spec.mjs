import { describe, it, expect } from 'vitest';
import { Program } from '@hyperionbt/helios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(__dirname, '../../contracts/nft-minting-policy.hl');

describe('nft-minting-policy with lock date', () => {
  let policySource;

  beforeAll(async () => {
    policySource = await fs.readFile(contractPath, 'utf8');
  });

  it('compiles with OWNER_PKH and LOCK_DATE parameters', () => {
    const program = Program.new(policySource);
    program.parameters = { ['OWNER_PKH']: 'a'.repeat(56) };
    program.parameters = { ['LOCK_DATE']: BigInt(Date.now()) };

    const compiled = program.compile(false);
    expect(compiled.mintingPolicyHash.hex).toMatch(/^[a-f0-9]{56}$/);
  });

  it('produces deterministic MPH for the same parameters', () => {
    const lockDate = BigInt(new Date('2027-12-31T23:59:59Z').getTime());
    const ownerPkh = 'b'.repeat(56);

    const compile = () => {
      const program = Program.new(policySource);
      program.parameters = { ['OWNER_PKH']: ownerPkh };
      program.parameters = { ['LOCK_DATE']: lockDate };
      return program.compile(false).mintingPolicyHash.hex;
    };

    expect(compile()).toBe(compile());
  });

  it('different lock dates produce different policy IDs', () => {
    const ownerPkh = 'c'.repeat(56);

    const compileWith = (lockMs) => {
      const program = Program.new(policySource);
      program.parameters = { ['OWNER_PKH']: ownerPkh };
      program.parameters = { ['LOCK_DATE']: BigInt(lockMs) };
      return program.compile(false).mintingPolicyHash.hex;
    };

    const mph1 = compileWith(new Date('2027-06-01T00:00:00Z').getTime());
    const mph2 = compileWith(new Date('2028-06-01T00:00:00Z').getTime());
    expect(mph1).not.toBe(mph2);
  });

  it('different owner PKHs produce different policy IDs', () => {
    const lockDate = BigInt(new Date('2027-12-31T23:59:59Z').getTime());

    const compileWith = (pkh) => {
      const program = Program.new(policySource);
      program.parameters = { ['OWNER_PKH']: pkh };
      program.parameters = { ['LOCK_DATE']: lockDate };
      return program.compile(false).mintingPolicyHash.hex;
    };

    expect(compileWith('a'.repeat(56))).not.toBe(compileWith('b'.repeat(56)));
  });

  it('policy hash is exactly 56 hex characters (28 bytes)', () => {
    const program = Program.new(policySource);
    program.parameters = { ['OWNER_PKH']: 'd'.repeat(56) };
    program.parameters = { ['LOCK_DATE']: BigInt(new Date('2027-01-01').getTime()) };

    const mph = program.compile(false).mintingPolicyHash.hex;
    expect(mph).toHaveLength(56);
    expect(mph).toMatch(/^[a-f0-9]+$/);
  });

  it('backwards compatibility: policy includes OWNER_PKH check', () => {
    // Verify the contract source still contains the owner signature check
    expect(policySource).toContain('is_signed_by');
    expect(policySource).toContain('OWNER_PKH');
  });

  it('contract includes time range check against LOCK_DATE', () => {
    expect(policySource).toContain('time_range');
    expect(policySource).toContain('LOCK_DATE');
    expect(policySource).toContain('lockTime');
  });
});
