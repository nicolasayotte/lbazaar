import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { TxMetadata } from '@hyperionbt/helios';
import {
  toHeliosMetadata,
  buildCustomMetadata,
  buildCIP25Metadata,
} from '../certificate-metadata.mjs';

// Contract test: every `tx.addMetadata(label, value)` call in run/ must pass
// a value that Helios's encodeMetadata accepts — string | number | array |
// { map: [[k,v]...] }. A plain `{ key: ... }` object is rejected at runtime
// with `invalid metadata schema` (helios.js encodeMetadata), but only when
// the script is actually invoked, often only in production.
//
// Two checks:
//   1) Lexical contract — every call site uses one of the known-safe shapes:
//        toHeliosMetadata(...) | JSON.stringify(...) | [ literal ] | a bare
//        identifier assigned (in same file) from one of those expressions or
//        from buildCustomMetadata / buildCIP25Metadata (themselves wrapped).
//   2) Runtime check — toHeliosMetadata and the buildXMetadata wrappers
//      actually produce output that survives TxMetadata.toCbor() on
//      representative inputs, justifying the lexical allow-list.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUN_DIR = path.resolve(__dirname, '../../run');

// ─── Static scanner ──────────────────────────────────────────────────

async function findMjsFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === '__tests__' || e.name === 'node_modules') continue;
      out.push(...(await findMjsFiles(full)));
    } else if (e.isFile() && e.name.endsWith('.mjs')) {
      out.push(full);
    }
  }
  return out;
}

function findBalancedClose(source, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitTopLevelComma(s) {
  const parts = [];
  let depth = 0;
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(s.slice(last, i));
      last = i + 1;
    }
  }
  parts.push(s.slice(last));
  return parts;
}

function findAddMetadataCalls(source) {
  const calls = [];
  const re = /tx\.addMetadata\s*\(/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const argsStart = re.lastIndex;
    const argsEnd = findBalancedClose(source, argsStart - 1);
    if (argsEnd === -1) continue;
    const inner = source.slice(argsStart, argsEnd);
    const parts = splitTopLevelComma(inner);
    if (parts.length < 2) continue;
    const valueSrc = parts.slice(1).join(',').trim();
    const line = source.slice(0, m.index).split('\n').length;
    calls.push({ line, valueSrc });
  }
  return calls;
}

// Known-safe identifier bindings: RHS expression starts with one of these.
const SAFE_RHS_PREFIXES = [
  /^toHeliosMetadata\s*\(/,
  /^buildCIP25Metadata\s*\(/,
  /^buildCustomMetadata\s*\(/,
];

function classifyValueShape(valueSrc, source) {
  const trimmed = valueSrc.trim();

  if (/^toHeliosMetadata\s*\(/.test(trimmed)) return { kind: 'toHeliosMetadata' };
  if (/^JSON\.stringify\s*\(/.test(trimmed)) return { kind: 'string' };
  if (trimmed.startsWith('[')) return { kind: 'array-literal' };

  const idMatch = trimmed.match(/^([A-Za-z_$][\w$]*)\s*$/);
  if (idMatch) {
    const name = idMatch[1];
    const assignRe = new RegExp(
      `(?:const|let|var)\\s+${name}\\s*=\\s*(?:await\\s+)?([\\s\\S]+?);`,
      'm',
    );
    const am = source.match(assignRe);
    if (!am) {
      return {
        kind: 'unsafe',
        reason: `identifier '${name}' has no resolvable assignment in same file`,
      };
    }
    const rhs = am[1].trim();
    if (SAFE_RHS_PREFIXES.some((re) => re.test(rhs))) {
      return { kind: `identifier→${rhs.match(/^(\w+)/)[1]}` };
    }
    return {
      kind: 'unsafe',
      reason: `identifier '${name}' assigned from unrecognized RHS: ${rhs.slice(0, 80)}`,
    };
  }

  return {
    kind: 'unsafe',
    reason: `value expression starts with '${trimmed.slice(0, 40)}…' — must be toHeliosMetadata(...), JSON.stringify(...), an array literal, or a bare identifier bound to one of those (or buildCIP25Metadata/buildCustomMetadata)`,
  };
}

function roundTrip(label, value) {
  const tm = new TxMetadata();
  tm.add(label, value);
  tm.toCbor();
}

// ─── Tests ────────────────────────────────────────────────────────

describe('Helios tx.addMetadata schema contract', () => {
  let callSites = [];

  beforeAll(async () => {
    const files = await findMjsFiles(RUN_DIR);
    for (const f of files) {
      const src = await fs.readFile(f, 'utf8');
      const rel = path.relative(RUN_DIR, f);
      for (const c of findAddMetadataCalls(src)) {
        callSites.push({ file: rel, ...c, classification: classifyValueShape(c.valueSrc, src) });
      }
    }
  });

  it('scanner discovers tx.addMetadata call sites', () => {
    expect(callSites.length).toBeGreaterThan(0);
  });

  it('every tx.addMetadata value uses a known-safe shape', () => {
    const violations = callSites.filter((c) => c.classification.kind === 'unsafe');
    if (violations.length > 0) {
      const msg = violations
        .map((v) => `  ${v.file}:${v.line} — ${v.classification.reason}`)
        .join('\n');
      throw new Error(
        `Found ${violations.length} tx.addMetadata call(s) with values that\n` +
          `Helios may reject with "invalid metadata schema". Wrap with\n` +
          `toHeliosMetadata({...}) or use one of the known wrappers.\n${msg}`,
      );
    }
  });

  it('toHeliosMetadata output round-trips through TxMetadata.toCbor()', () => {
    expect(() =>
      roundTrip(674, toHeliosMetadata({
        msg: ['Token reward', 'Course: 42', 'Quantity: 10'],
      })),
    ).not.toThrow();

    expect(() =>
      roundTrip(674, toHeliosMetadata({
        nested: { inner: 'value' },
        arr: [1, 'two', { three: 3 }],
      })),
    ).not.toThrow();
  });

  it('buildCustomMetadata output round-trips through TxMetadata.toCbor()', () => {
    const out = buildCustomMetadata({
      course_title: 'Test Course',
      student_name: 'Alice',
      teacher_name: 'Bob',
      completion_date: '2026-05-14',
    });
    expect(() => roundTrip(674, out)).not.toThrow();
  });

  it('buildCIP25Metadata output round-trips through TxMetadata.toCbor()', async () => {
    const out = await buildCIP25Metadata(
      '0'.repeat(56),
      Buffer.from('TestAsset').toString('hex'),
      {
        course_title: 'Test Course',
        student_name: 'Alice',
        teacher_name: 'Bob',
        completion_date: '2026-05-14',
        certificate_name: 'Cert',
        certificate_description: 'Desc',
        course_id: '1',
        cohort: '1',
        grade: 'Pass',
        score: '100',
        serial_number: '123',
        student_email: 'alice@example.com',
      },
      'ipfs://bafkreitestcid000000000000000000000000000000000000000',
    );
    expect(() => roundTrip(721, out)).not.toThrow();
  });

  it('plain `{ key: value }` literal is rejected (regression guard)', () => {
    expect(() => roundTrip(674, { msg: ['hello'] })).toThrow(/invalid metadata schema/);
  });
});
