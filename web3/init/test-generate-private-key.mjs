import { execSync } from 'child_process';
import assert from 'assert';

// Test: generate-private-key.mjs should output a 64-character ROOT_KEY when no ENTROPY is provided
const output = execSync('node ./web3/init/generate-private-key.mjs', { encoding: 'utf8' });

const match = output.match(/ROOT_KEY=([a-fA-F0-9]{64})\b/);

assert(match, 'ROOT_KEY not found or not 64 hex characters');
console.log('Test passed: ROOT_KEY is 64 hex characters:', match[1]);
