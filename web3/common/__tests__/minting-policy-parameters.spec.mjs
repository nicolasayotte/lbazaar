import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Program } from '@hyperionbt/helios';

// Contract test: every `program.parameters = { ['KEY']: ... }` assignment in
// run/ and common/ must use a key declared by the .hl script the program was
// compiled from. Catches the class of bug where a script sets a parameter name
// (e.g. 'VERSION') that the Helios policy doesn't declare — which fails at
// runtime with `invalid parameter name 'X'` only when the script is actually
// invoked, often in production.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB3_ROOT = path.resolve(__dirname, '../..');
const CONTRACTS_DIR = path.join(WEB3_ROOT, 'contracts');

async function findMjsFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      results.push(...(await findMjsFiles(full)));
    } else if (e.isFile() && e.name.endsWith('.mjs')) {
      results.push(full);
    }
  }
  return results;
}

// Walk source and resolve which .hl file each `program.parameters = ...`
// targets by tracking `var = fs.readFile('./contracts/X.hl')`, optional
// `.toString()` aliasing, and `var = Program.new(scriptVar)`.
function extractParameterAssignments(source) {
  const fileVarToHl = new Map();
  const fileReadRe =
    /(?:const|let|var)\s+\{?\s*(\w+)\s*\}?\s*=\s*(?:await\s+)?fs\.readFile\(\s*['"][^'"]*contracts\/([\w-]+\.hl)['"]/g;
  for (const m of source.matchAll(fileReadRe)) {
    fileVarToHl.set(m[1], m[2]);
  }

  // alias chains: `const X = Y.toString()` or `const X = Y;`
  let changed = true;
  while (changed) {
    changed = false;
    const aliasRe = /(?:const|let|var)\s+(\w+)\s*=\s*(\w+)(?:\.toString\(\))?\s*;/g;
    for (const m of source.matchAll(aliasRe)) {
      if (fileVarToHl.has(m[2]) && !fileVarToHl.has(m[1])) {
        fileVarToHl.set(m[1], fileVarToHl.get(m[2]));
        changed = true;
      }
    }
  }

  const progVarToHl = new Map();
  const progNewRe = /(?:const|let|var)\s+(\w+)\s*=\s*Program\.new\(\s*(\w+)\s*\)/g;
  for (const m of source.matchAll(progNewRe)) {
    if (fileVarToHl.has(m[2])) progVarToHl.set(m[1], fileVarToHl.get(m[2]));
  }

  const assignments = [];
  const paramRe =
    /(\w+)\.parameters\s*=\s*\{\s*\[?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?\s*\]?\s*:/g;
  let m;
  while ((m = paramRe.exec(source)) !== null) {
    const [, varName, key] = m;
    const hlFile = progVarToHl.get(varName);
    if (!hlFile) continue; // could not resolve — skip rather than false-flag
    const line = source.slice(0, m.index).split('\n').length;
    assignments.push({ varName, key, hlFile, line });
  }
  return assignments;
}

// Type-correct dummy values keyed by parameter name. The point is to bypass
// Helios's value-type checks so the test only fires on the name-lookup throw
// ("invalid parameter name 'X'").
const DUMMY_VALUE_BY_KEY = {
  OWNER_PKH:  '0'.repeat(56),                  // 28-byte ByteArray hex
  LOCK_DATE:  0n,                              // Int
  TOKEN_MPH:  '0'.repeat(56),                  // 28-byte ByteArray hex
  TOKEN_NAME: new Uint8Array([0x30]),          // ByteArray
  VERSION:    new Uint8Array([0x31, 0x2e, 0x30]), // ByteArray ('1.0')
};
const DEFAULT_DUMMY = new Uint8Array([0]);

describe('Helios program parameter contract', () => {
  let assignments = [];
  const programByHl = new Map();

  beforeAll(async () => {
    const dirs = [path.join(WEB3_ROOT, 'run'), path.join(WEB3_ROOT, 'common')];
    for (const dir of dirs) {
      const files = await findMjsFiles(dir);
      for (const f of files) {
        const src = await fs.readFile(f, 'utf8');
        const rel = path.relative(WEB3_ROOT, f);
        for (const a of extractParameterAssignments(src)) {
          assignments.push({ file: rel, ...a });
        }
      }
    }

    const hlFiles = new Set(assignments.map((a) => a.hlFile));
    for (const hl of hlFiles) {
      const src = await fs.readFile(path.join(CONTRACTS_DIR, hl), 'utf8');
      programByHl.set(hl, Program.new(src));
    }
  });

  it('discovers parameter assignments via static scan', () => {
    expect(assignments.length).toBeGreaterThan(0);
  });

  it('every parameter key is declared by the .hl script it targets', () => {
    const violations = [];
    for (const { file, line, key, hlFile } of assignments) {
      const program = programByHl.get(hlFile);
      const dummy = DUMMY_VALUE_BY_KEY[key] ?? DEFAULT_DUMMY;
      try {
        program.parameters = { [key]: dummy };
      } catch (err) {
        const msg = String(err?.message ?? err);
        if (/invalid parameter name/i.test(msg)) {
          violations.push(`${file}:${line} — '${key}' is not declared in ${hlFile}`);
        }
        // any other error (e.g. type coercion) means the NAME was accepted —
        // not what this contract test is policing.
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Helios parameter contract violations:\n  ${violations.join('\n  ')}`,
      );
    }
  });
});
