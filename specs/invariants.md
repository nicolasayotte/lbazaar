# Project Invariants — Le Bazaar Milestone 4

These truths are inherited by ALL contracts in this tree.

- All monetary values displayed to users must clearly indicate their currency (JPY or ADA). Mixed or ambiguous currency display is prohibited.
- A student must never gain access to a class without a fully confirmed payment (10 on-chain confirmations for ADA; successful Stripe charge for credit card). No optimistic access grants at any depth in the implementation tree.
- Blockchain operations (transaction building, minting, submission) must execute server-side. Browser-side wallet interactions are limited to signing only (CIP-30 `signTx(tx, partial=true)` returns a `TransactionWitnessSet`; merge and submit happen server-side only).
- Reward delivery failure must never affect a student's completion status.
- Duplicate reward delivery (airdrop + self-mint, or double airdrop) to the same student for the same class must be prevented at the data layer.
- No private key material (custodial wallet keys, platform ROOT_KEY, private derivation paths, OWNER_PKH) may be returned in any client-facing HTTP response or written to client-accessible log files.