import { execSync } from 'child_process';
import assert from 'assert';

// Test: generate-private-key.mjs should output OWNER_PKH (56 hex chars) when no ENTROPY is provided
const output = execSync('node ./web3/init/generate-private-key.mjs', { encoding: 'utf8' });

const match = output.match(/OWNER_PKH=([a-fA-F0-9]{56})/);

assert(match, 'OWNER_PKH not found or not 56 hex characters');
console.log('Test passed: OWNER_PKH is 56 hex characters:', match[1]);
