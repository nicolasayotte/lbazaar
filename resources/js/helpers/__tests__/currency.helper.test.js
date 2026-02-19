import { formatJpy, formatAda, formatDualPrice, parseJpy } from '../currency.helper';

describe('currency.helper', () => {
    describe('formatJpy', () => {
        it('formats JPY with yen symbol and thousands separator', () => {
            expect(formatJpy(1000)).toBe('¥1,000');
            expect(formatJpy(1234567)).toBe('¥1,234,567');
        });

        it('handles zero and small amounts', () => {
            expect(formatJpy(0)).toBe('¥0');
            expect(formatJpy(50)).toBe('¥50');
        });

        it('handles null and undefined as error indicator', () => {
            expect(formatJpy(null)).toBe('¥--');
            expect(formatJpy(undefined)).toBe('¥--');
        });

        it('handles decimal values by rounding', () => {
            expect(formatJpy(1000.99)).toBe('¥1,001');
        });
    });

    describe('formatAda', () => {
        it('formats ADA with symbol and 2 decimals', () => {
            expect(formatAda(10.5)).toBe('₳10.50');
            expect(formatAda(100)).toBe('₳100.00');
        });

        it('handles zero', () => {
            expect(formatAda(0)).toBe('₳0.00');
        });

        it('handles null and undefined as error indicator', () => {
            expect(formatAda(null)).toBe('₳--');
            expect(formatAda(undefined)).toBe('₳--');
        });

        it('rounds to 2 decimal places', () => {
            expect(formatAda(10.567)).toBe('₳10.57');
            expect(formatAda(10.561)).toBe('₳10.56');
        });
    });

    describe('formatDualPrice', () => {
        it('formats both currencies together', () => {
            expect(formatDualPrice(1000, 20)).toBe('¥1,000 (~₳20.00)');
            expect(formatDualPrice(5000, 100.5)).toBe('¥5,000 (~₳100.50)');
        });

        it('returns JPY only when ADA is missing', () => {
            expect(formatDualPrice(1000, null)).toBe('¥1,000');
            expect(formatDualPrice(1000, 0)).toBe('¥1,000');
        });

        it('does not include ADA placeholder when ADA is null (TS-01.03)', () => {
            const result = formatDualPrice(1000, null);
            expect(result).toBe('¥1,000');
            expect(result).not.toContain('₳--');
            expect(result).not.toContain('₳0');
        });

        it('returns zero when JPY is missing', () => {
            expect(formatDualPrice(0, 20)).toBe('¥0');
            expect(formatDualPrice(null, 20)).toBe('¥0');
        });

        it('includes live-conversion indicator (~₳) when ADA is provided (TS-01.01, TS-01.02)', () => {
            expect(formatDualPrice(1000, 20)).toContain('(~₳');
        });
    });

    describe('parseJpy', () => {
        it('parses formatted JPY string to number', () => {
            expect(parseJpy('¥1,000')).toBe(1000);
            expect(parseJpy('¥1,234,567')).toBe(1234567);
        });

        it('handles numeric strings', () => {
            expect(parseJpy('1000')).toBe(1000);
        });

        it('handles null and empty strings', () => {
            expect(parseJpy(null)).toBe(0);
            expect(parseJpy('')).toBe(0);
            expect(parseJpy(undefined)).toBe(0);
        });
    });
});
