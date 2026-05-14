/**
 * Encode a pure-lovelace amount as a CIP-30 `cbor<value>` hex string suitable
 * for `walletAPI.getUtxos(amount)`.
 *
 * Without an amount hint many wallets (Eternl, Nami) return only a default
 * subset of UTxOs, which can omit the ADA-rich ones in a heavily populated
 * wallet and leave the tx builder with insufficient inputs. Passing an amount
 * forces the wallet to do coin selection covering at least that much lovelace.
 *
 * CIP-30 amount format: `value = coin / [coin, multiasset<uint>]` — pure
 * lovelace is just the CBOR uint encoding of the lovelace integer.
 */
export const encodeCip30LovelaceAmount = (lovelace) => {
    const n = BigInt(lovelace);
    if (n < BigInt(0)) throw new Error('lovelace must be non-negative');

    const toHex = (bytes) =>
        bytes.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (n < BigInt(24)) {
        return toHex([Number(n)]);
    }
    if (n < BigInt(256)) {
        return toHex([0x18, Number(n)]);
    }
    if (n < BigInt(65536)) {
        const v = Number(n);
        return toHex([0x19, (v >> 8) & 0xff, v & 0xff]);
    }
    if (n < BigInt(4294967296)) {
        const v = Number(n);
        return toHex([
            0x1a,
            (v >>> 24) & 0xff,
            (v >>> 16) & 0xff,
            (v >>> 8) & 0xff,
            v & 0xff,
        ]);
    }
    // uint64
    const bytes = [0x1b];
    const mask = BigInt(0xff);
    for (let i = 7; i >= 0; i--) {
        bytes.push(Number((n >> BigInt(i * 8)) & mask));
    }
    return toHex(bytes);
};
