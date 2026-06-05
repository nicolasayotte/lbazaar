# TODO

## Revisit: certificate paired-token / CIP-68 design

The certificate mint currently creates a **pair** of tokens per certificate
(`web3/run/build-certificate-tx.mjs`):

- `(222)<nftName>|<serial>` → sent to the student (the actual certificate NFT)
- `(100)<nftName>|<serial>` → sent to the platform's own wallet, bare

Metadata is **CIP-25** (label 721), keyed on the `(222)` asset name. The `(100)`
token's only use is **revocation**: the platform burns its own `(100)` copy and
writes a `revoked: true` 721 metadata update (`web3/run/revoke-certificate-tx.mjs`).

### Why this needs revisiting

- **Not real CIP-68.** The prefixes are the literal ASCII strings `'(100)'` /
  `'(222)'`, not the CIP-68 hex byte labels (`000643b0` / `000de140`). No wallet
  or explorer recognizes them as CIP-68 ref/user tokens.
- **No datum, not script-locked.** The `(100)` token is a plain token in the
  owner wallet — it does none of the CIP-68 reference-token job (metadata-in-datum).
- **Weak revocation.** Burning a token only the platform held never touches the
  student's `(222)` NFT; revocation is effectively an off-chain/metadata signal.
- **Cost.** Every mint locks ~2 ADA (min ADA) + an extra output in the owner
  wallet, permanently, for no standards-conformant benefit.

### Decision: emit a revocation token on demand

**Chosen direction.** Drop the per-mint `(100)` reference token. Mint a single
`(222)` certificate NFT per issuance. When a certificate needs revoking (rare,
<1% of certs), mint a deterministic **revocation marker** under the same policy
on demand — e.g. `(REVOKED)<nftName>|<serial>` — and attach the existing
`revoked: true` CIP-25 update (label 721) keyed to the original `(222)` asset
name.

Rationale:
- **Pay-on-revoke, not pay-on-every-mint.** The current scheme locks ~2 ADA + an
  extra output on 100% of mints to support an operation that fires on <1%. Moving
  the cost to the revocation tx makes the common issuance path cheaper and smaller.
- **No loss of authority.** Both mint/burn under the same `OWNER_PKH`-gated policy,
  so both require the platform signature. On-demand minting is just as authoritative
  as burning a pre-held token.
- **Cleaner verification.** A deterministic marker name turns revocation-checking
  into a single Blockfrost asset-existence query (`(REVOKED)X` exists → revoked),
  more robust than "is the `(100)` token still present?" or parsing latest 721.

Implementation notes / carry-overs:
- `nft-minting-policy.hl`: the revocation mint uses the existing `Mint` redeemer +
  owner signature — already permitted.
- **Lock-date semantics carry over.** Today revocation only works before `LOCK_DATE`
  (`canBurn = now < lockTimestamp`, `revoke-certificate-tx.mjs:126`). Decide whether
  the revocation-token mint should keep that constraint.
- Update both verify paths (`web3/run/nft-verify.mjs` and the PHP verify path) to
  check for the revocation marker instead of the `(100)` token.
- The student keeps their `(222)` NFT either way — revocation is a platform-side
  signal + metadata, inherent to non-custodial issuance.

Rejected alternative: **real CIP-68** (proper hex labels, reference token locked at
the validator with metadata in its datum). More standards-conformant and third-party
verifiable, but heavier than warranted for a rare revocation signal. Revisit only if
on-chain, indexer-discoverable certificate metadata becomes a requirement.

The current scheme is the worst of both: the cost of paired tokens without the
standards-conformance that would justify them — hence the change above.

For the Milestone 4 Proof of Achievement, we only **describe current behavior**
(CIP-25 with CIP-68-style naming) — no redesign required for the milestone.
