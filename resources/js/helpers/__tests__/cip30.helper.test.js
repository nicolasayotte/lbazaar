import { encodeCip30LovelaceAmount } from '../cip30.helper';

describe('cip30.helper', () => {
    describe('encodeCip30LovelaceAmount', () => {
        // CBOR uint encoding (RFC 8949 §3.1) — verified against reference encoder.

        it('encodes small values (< 24) as single byte', () => {
            expect(encodeCip30LovelaceAmount(0)).toBe('00');
            expect(encodeCip30LovelaceAmount(1)).toBe('01');
            expect(encodeCip30LovelaceAmount(23)).toBe('17');
        });

        it('encodes 24..255 with 0x18 prefix', () => {
            expect(encodeCip30LovelaceAmount(24)).toBe('1818');
            expect(encodeCip30LovelaceAmount(100)).toBe('1864');
            expect(encodeCip30LovelaceAmount(255)).toBe('18ff');
        });

        it('encodes 256..65535 with 0x19 prefix', () => {
            expect(encodeCip30LovelaceAmount(256)).toBe('190100');
            expect(encodeCip30LovelaceAmount(1000)).toBe('1903e8');
            expect(encodeCip30LovelaceAmount(65535)).toBe('19ffff');
        });

        it('encodes 65536..2^32-1 with 0x1a prefix', () => {
            expect(encodeCip30LovelaceAmount(65536)).toBe('1a00010000');
            // 100 ADA = 100_000_000 lovelace — the typical hint amount
            expect(encodeCip30LovelaceAmount(100_000_000)).toBe('1a05f5e100');
            expect(encodeCip30LovelaceAmount(4294967295)).toBe('1affffffff');
        });

        it('encodes ≥ 2^32 with 0x1b prefix (uint64)', () => {
            expect(encodeCip30LovelaceAmount(4294967296n)).toBe('1b0000000100000000');
            // 1 trillion lovelace = 1M ADA
            expect(encodeCip30LovelaceAmount(1_000_000_000_000n)).toBe('1b000000e8d4a51000');
        });

        it('encodes max uint64 with all bytes set', () => {
            // 2^64 - 1 — exercises every byte position of the mask/shift loop
            expect(encodeCip30LovelaceAmount(18446744073709551615n)).toBe(
                '1bffffffffffffffff',
            );
        });

        it('encodes uint64 values with non-zero high bytes', () => {
            // Alternating high bytes — verifies the mask isolates each byte
            // without bleed from adjacent bytes.
            expect(encodeCip30LovelaceAmount(0xff00ff00ff00ff00n)).toBe(
                '1bff00ff00ff00ff00',
            );
            // Walking-1 in the top byte — must not leak into lower bytes.
            expect(encodeCip30LovelaceAmount(0x0100000000000000n)).toBe(
                '1b0100000000000000',
            );
        });

        it('accepts both Number and BigInt inputs', () => {
            expect(encodeCip30LovelaceAmount(100_000_000)).toBe(
                encodeCip30LovelaceAmount(100_000_000n),
            );
        });

        it('throws on negative values', () => {
            expect(() => encodeCip30LovelaceAmount(-1)).toThrow(/non-negative/);
        });
    });
});
