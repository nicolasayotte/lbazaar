# Blockfrost API Reference

Below is an extensive, “crammed” Markdown reference for the Blockfrost API. It covers authentication, conventions, limits, SDKs, core endpoint categories (with key paths and descriptions), and additional resources. Citations point to the official OpenAPI spec and Blockfrost documentation throughout.

Blockfrost is a hosted JSON-over-HTTP service that exposes Cardano blockchain, IPFS, and Milkomeda networks via a single, consistent REST interface. Every request must carry a `project_id` API key in the header, and you choose among network-specific base URLs (mainnet, testnet, preview, IPFS, Milkomeda). Responses are paginated (default 100 per page), returned in ascending order by default, use UNIX-time seconds and Lovelace units, and follow strict Bech32 and lowercase hex formats. Error handling covers standard HTTP codes plus custom internal payloads. Rate limits combine daily quotas with bursts of up to 500 requests cooling at 10 req/s. A rich set of SDKs (JavaScript, Python, Rust, Go, etc.) and OpenAPI-driven interactive docs round out the developer experience. ([GitHub][1])

---

## Authentication & Base URLs

* **API Key**: Include your `project_id` in the `project_id` header on every request. ([blockfrost.dev][2])
* **Available Networks & Endpoints**: Each network has its own `project_id` and URL prefix:

  * Cardano Mainnet: `https://cardano-mainnet.blockfrost.io/api/v0`
  * Cardano Preprod: `https://cardano-preprod.blockfrost.io/api/v0`
  * Cardano Preview: `https://cardano-preview.blockfrost.io/api/v0`
  * IPFS Gateway: `https://ipfs.blockfrost.io/api/v0`
  * Milkomeda Mainnet: `https://milkomeda-mainnet.blockfrost.io/api/v0`
  * Milkomeda Testnet: `https://milkomeda-testnet.blockfrost.io/api/v0` ([GitHub][1])

---

## Conventions & Data Formats

* **Pagination & Ordering**: Default page size is 100; use `?page=<n>`. Results are oldest→newest by default; reverse with `?order=desc`. ([GitHub][1])
* **Timestamps**: UNIX time in seconds (except `server_time` which is milliseconds). ([GitHub][1])
* **Amounts**: All ADA amounts returned in Lovelaces (1 ADA = 1 000 000 Lovelaces). ([GitHub][1])
* **Formats**:

  * Addresses, accounts, pool IDs: Bech32
  * Hex values: lowercase
  * Examples are synthetic; IPFS uploads capped at 100 MB; only pinned files count toward quotas. ([GitHub][1])

---

## Error Handling

* **HTTP Status Codes**:

  * `400` Bad request
  * `402` Daily quota exceeded
  * `403` Authentication failed
  * `404` Resource not found
  * `418` Auto-ban after flooding (post-`402/429`)
  * `425` Mempool or IPFS queue full
  * `429` Rate limited
  * `500` Server error ([GitHub][1])
* **Error Payload**:

  ````json
  {
    "status_code": 403,
    "error": "Forbidden",
    "message": "Invalid project token."
  }
  ``` :contentReference[oaicite:8]{index=8}
  ````

---

## Rate Limits & Quotas

* **Daily Quota**: Defined by your plan; resets at UTC midnight. ([GitHub][1])
* **Burst Rate Limiting**:

  * Steady state: 10 req/s per IP
  * Burst: up to 500 requests, then cools at 10 req/s (full burst replenished after \~50 s). ([GitHub][1])

---

## SDKs

Official client libraries generated from OpenAPI:
JavaScript, Python, Rust, Go, Haskell, Java, Scala, Ruby, Swift, Kotlin, Elixir, .NET, Arduino, PHP, Crystal ([GitHub][1])

---

## Core Endpoints

### Health

| Method | Path            | Description                             |               |
| ------ | --------------- | --------------------------------------- | ------------- |
| GET    | `/`             | Root: points to docs and version.       |               |
| GET    | `/health`       | Backend health (`is_healthy`: boolean). |               |
| GET    | `/health/clock` | Current UNIX time (`server_time`: ms).  | ([GitHub][1]) |

### Cardano » Blocks

| Method | Path                                              | Description                       |               |
| ------ | ------------------------------------------------- | --------------------------------- | ------------- |
| GET    | `/blocks/latest`                                  | Tip of the blockchain.            |               |
| GET    | `/blocks/latest/txs`                              | Transactions in the latest block. |               |
| GET    | `/blocks/{hash_or_number}`                        | Specific block by hash or number. |               |
| GET    | `/blocks/{hash_or_number}/txs`                    | Tx list within a block.           |               |
| GET    | `/blocks/{hash_or_number}/next`                   | Blocks following given block.     |               |
| GET    | `/blocks/{hash_or_number}/previous`               | Blocks preceding given block.     |               |
| GET    | `/blocks/slot/{slot_number}`                      | Block at a specific slot.         |               |
| GET    | `/blocks/epoch/{epoch_number}/slot/{slot_number}` | Block in a specific epoch slot.   |               |
| GET    | `/blocks/{hash_or_number}/addresses`              | Addresses affected in a block.    | ([GitHub][1]) |

### Cardano » Epochs

| Method | Path                                | Description                            |               |
| ------ | ----------------------------------- | -------------------------------------- | ------------- |
| GET    | `/epochs/latest`                    | Current epoch.                         |               |
| GET    | `/epochs/latest/parameters`         | Protocol parameters for current epoch. |               |
| GET    | `/epochs/{number}`                  | Specific epoch data.                   |               |
| GET    | `/epochs/{number}/next`             | Following epochs.                      |               |
| GET    | `/epochs/{number}/previous`         | Preceding epochs.                      |               |
| GET    | `/epochs/{number}/stakes`           | Stake distribution for epoch.          |               |
| GET    | `/epochs/{number}/stakes/{pool_id}` | Stake by pool.                         |               |
| GET    | `/epochs/{number}/blocks`           | Blocks minted in epoch.                |               |
| GET    | `/epochs/{number}/blocks/{pool_id}` | Blocks by pool.                        |               |
| GET    | `/epochs/{number}/parameters`       | Protocol parameters for epoch.         | ([GitHub][1]) |

### Cardano » Transactions

| Method | Path                        | Description                           |               |
| ------ | --------------------------- | ------------------------------------- | ------------- |
| GET    | `/txs/{hash}`               | Transaction content.                  |               |
| GET    | `/txs/{hash}/utxos`         | Inputs and UTXOs.                     |               |
| GET    | `/txs/{hash}/stakes`        | Stake-address certificates.           |               |
| GET    | `/txs/{hash}/delegations`   | Delegation certificates.              |               |
| GET    | `/txs/{hash}/withdrawals`   | Withdrawals.                          |               |
| GET    | `/txs/{hash}/mirs`          | Move Instantaneous Rewards.           |               |
| GET    | `/txs/{hash}/pool_updates`  | Stake pool registration/update certs. |               |
| GET    | `/txs/{hash}/pool_retires`  | Stake pool retirement certs.          |               |
| GET    | `/txs/{hash}/metadata`      | Metadata JSON.                        |               |
| GET    | `/txs/{hash}/metadata/cbor` | Metadata in CBOR.                     |               |
| GET    | `/txs/{hash}/redeemers`     | Redeemers.                            |               |
| POST   | `/tx/submit`                | Submit a serialized CBOR transaction. | ([GitHub][1]) |

### Cardano » Accounts

| Method | Path                                      | Description                          |               |
| ------ | ----------------------------------------- | ------------------------------------ | ------------- |
| GET    | `/accounts/{stake_address}`               | Stake account info.                  |               |
| GET    | `/accounts/{stake_address}/rewards`       | Reward history.                      |               |
| GET    | `/accounts/{stake_address}/history`       | Account history.                     |               |
| GET    | `/accounts/{stake_address}/delegations`   | Delegation history.                  |               |
| GET    | `/accounts/{stake_address}/registrations` | Registration/deregistration history. |               |
| GET    | `/accounts/{stake_address}/withdrawals`   | Withdrawal history.                  |               |
| GET    | `/accounts/{stake_address}/mirs`          | MIR history.                         |               |
| GET    | `/accounts/{stake_address}/addresses`     | Associated addresses.                | ([GitHub][1]) |

### Additional Cardano Categories

Blockfrost also exposes endpoints under these tags:
**Assets**, **Addresses**, **Ledger** (`/genesis`), **Mempool**, **Metadata**, **Network**, **Pools**, **Scripts**, **Utilities** (e.g. `/genesis`, `/network`, `/pools`, `/scripts`, `/utils/...`). See the OpenAPI spec for full details. ([GitHub][1])

---

## IPFS Endpoints

| Group       | Key Paths                                                            | Description                |               |
| ----------- | -------------------------------------------------------------------- | -------------------------- | ------------- |
| **Add**     | `POST /ipfs/add`                                                     | Upload & pin file to IPFS. |               |
| **Gateway** | `GET /ipfs/gateway/{cid}`                                            | Retrieve content by CID.   |               |
| **Pins**    | `GET /ipfs/pins`, `POST /ipfs/pins/{cid}`, `DELETE /ipfs/pins/{cid}` | Manage pin queue & status. | ([GitHub][1]) |

---

## Additional Resources

* **Interactive Swagger UI**: [https://docs.blockfrost.io/](https://docs.blockfrost.io/) ([docs.blockfrost.io][3])
* **Static API Reference**: [https://blockfrost.dev/api/blockfrost-io-api-documentation](https://blockfrost.dev/api/blockfrost-io-api-documentation) ([blockfrost.dev][4])
* **OpenAPI Spec (YAML)**: [https://raw.githubusercontent.com/blockfrost/openapi/.../openapi.yaml](https://raw.githubusercontent.com/blockfrost/openapi/.../openapi.yaml) ([GitHub][1])

Feel free to explore the full spec for exhaustive parameter-level details, schema definitions, and code samples.

[1]: https://raw.githubusercontent.com/blockfrost/openapi/daf40b1a88463bebd5d562bcabb18d5c001bf83e/openapi.yaml "raw.githubusercontent.com"
[2]: https://blockfrost.dev/api/blockfrost-io-api-documentation "Blockfrost.io ~ API Documentation | Blockfrost Development Hub"
[3]: https://docs.blockfrost.io/?utm_source=chatgpt.com "Blockfrost.io - Blockfrost Open API"
[4]: https://blockfrost.dev/api/blockfrost-io-api-documentation?utm_source=chatgpt.com "Blockfrost.io ~ API Documentation | Blockfrost Development Hub"
