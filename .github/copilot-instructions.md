# Copilot Custom Instructions

## Project Guidelines
- Follow best practices for Laravel and PHP development.
- Use factories for all model-related tests.
- When adding new features, update both the database schema and factories as needed.
- Document any new API endpoints or integrations in this knowledge base.
- For Cardano or NMKR integrations, refer to the NMKR API section below.

# NMKR API Reference

- [NMKR API Documentation](https://api.nmkr.io/docs)


## Summary

The NMKR Studio API is a RESTful HTTP interface exposing NMKR Studio’s full feature set—project and NFT management, payments, whitelisting, minting, and more—via versioned `/v2` endpoints using standard GET and POST requests ([NMKR Docs][1]). Authentication hinges on an API Key you generate in NMKR Studio and send as a Bearer token in the `Authorization` header, with separate base URLs for Testnet (preprod) and Mainnet ([NMKR Docs][2]). Key endpoint categories—User, Asset (Token), Project, Payment Transactions, Whitelist, Minting, Tools—are fully documented in the API Features section for quick lookup ([NMKR Docs][3]). You can prototype calls interactively via the Swagger UI or browse cURL examples in the API Examples docs ([NMKR Docs][4]). A first-class TypeScript client and community-driven generators streamline integration—see the GitHub repository for codegen tips ([GitHub][5], [GitHub][5]).

## Authentication & Base URL

### API Key

* Create an API Key in NMKR Studio under your Testnet or Mainnet account before making any calls. ([NMKR Docs][2])

### Base URLs

* **Testnet (preprod):**

  ````
  https://studio-api.preprod.nmkr.io/v2/
  ``` :contentReference[oaicite:6]{index=6}  
  ````
* **Mainnet:**

  ````
  https://studio-api.nmkr.io/v2/
  ``` :contentReference[oaicite:7]{index=7}  
  ````

### Authorization Header

* Send your key as a Bearer token:

  ````
  Authorization: Bearer <API_KEY>
  ``` :contentReference[oaicite:8]{index=8}
  ````

## Endpoint Cheat Sheet

### User

* **Add Payout Wallet**
  `POST /v2/AddPayoutWallet/{walletaddress}` – add a payout wallet to your account ([NMKR Docs][3])
* **List Payout Wallets**
  `GET /v2/GetPayoutWallets` – retrieve all payout wallets ([NMKR Docs][3])
* **Create Subcustomer**
  `POST /v2/CreateSubcustomer/{customerid}` – spin up a new subcustomer ([NMKR Docs][3])
* **Create API Key for Subcustomer**
  `POST /v2/CreateApikeyForSubcustomer/{customerid}` – issue a key for that subcustomer ([NMKR Docs][3])

### Asset (Token)

* **Block/Unblock NFT**
  `POST /v2/BlockUnblockNft/{nftuid}/{blockNft}` – toggle NFT block status ([NMKR Docs][3])
* **Check Metadata**
  `GET /v2/CheckMetadata/{nftuid}` – validate an NFT’s metadata ([NMKR Docs][3])
* **List NFTs**
  `GET /v2/GetNfts/{projectuid}/{state}/{count}/{page}` – paginated NFT list by state ([NMKR Docs][3])
* **Upload NFT**
  `POST /v2/UploadNft/{projectuid}` – upload a file and pin to IPFS ([NMKR Docs][3])

### Project

* **Create Project**
  `POST /v2/CreateProject` – initialize a new project ([NMKR Docs][3])
* **Get Project Details**
  `GET /v2/ProjectDetails/{projectuid}` – fetch project metadata and settings ([NMKR Docs][3])
* **List Projects**
  `GET /v2/ListProjects/{count}/{page}` – get a paginated list of your projects ([NMKR Docs][3])
* **Delete Project**
  `DELETE /v2/DeleteProject/{projectuid}` – remove a project permanently ([NMKR Docs][3])

### Payment Transactions

* **Create Transaction**
  `POST /v2/CreatePaymentTransaction` – start a payment flow ([NMKR Docs][3])
* **Get Transaction State**
  `GET /v2/ProceedPaymentTransaction/{paymenttransactionuid}/GetTransactionState` – poll status ([NMKR Docs][3])
* **Get Payment Address**
  `GET /v2/ProceedPaymentTransaction/{paymenttransactionuid}/PaymentAddress` – retrieve address for payment ([NMKR Docs][3])
* **Submit Transaction**
  `POST /v2/ProceedPaymentTransaction/{paymenttransactionuid}/SubmitTransaction` – finalize the payment ([NMKR Docs][3])

### Whitelist

* **List Whitelist**
  `GET /v2/ManageWhitelist/{projectuid}` – view whitelist entries ([NMKR Docs][3])
* **Add to Whitelist**
  `POST /v2/ManageWhitelist/{projectuid}/{address}/{countofnfts}` – add an address ([NMKR Docs][3])
* **Remove from Whitelist**
  `DELETE /v2/ManageWhitelist/{projectuid}/{address}` – delete an entry ([NMKR Docs][3])

### Minting

* **Mint Random NFTs**
  `POST /v2/MintAndSendRandom/{projectuid}/{countnft}/{receiveraddress}` – mint and transfer random NFTs ([NMKR Docs][3])

### Tools

* **Check Discount Eligibility**
  `GET /v2/CheckIfEglibleForDiscount/{projectuid}/{address}` – verify discounts ([NMKR Docs][3])
* **Get UTXO**
  `GET /v2/CheckUtxo/{address}` – fetch UTXO details for an address ([NMKR Docs][3])

## SDK & Client Libraries

* **TypeScript Client**
  Available on npm as `nmkr-studio-api` (v1.0.33) ([Libraries.io][6])
* **JSDelivr CDN**
  `https://cdn.jsdelivr.net/npm/nmkr-studio-api` ([jsDelivr][7])
* **Maintenance Status**
  Snyk reports a sustainable release cadence with recent updates in the past 4 months ([Snyk][8])
* **Code Generation**
  Use `openapi-typescript-codegen` against the Swagger spec at
  `https://studio-api.nmkr.io/swagger/v2/swagger.json` ([GitHub][5])

## Additional Resources

* **Interactive Swagger UI**
  Explore and test endpoints at `https://studio-api.nmkr.io/swagger/v2/swagger.json` ([NMKR Docs][2])
* **API Examples**
  Find curated cURL snippets and templates in the API Examples section of the docs ([NMKR Docs][4])


## External References
[1]: https://docs.nmkr.io/nmkr-studio-api/introduction-nmkr-studio-api "Introduction - NMKR Studio API | NMKR Docs"
[2]: https://docs.nmkr.io/nmkr-studio-api/get-started-with-the-api "Get started with the API | NMKR Docs"
[3]: https://docs.nmkr.io/nmkr-studio-api/api-features "API Features | NMKR Docs"
[4]: https://docs.nmkr.io/nmkr-studio-api/api-examples?utm_source=chatgpt.com "API Examples | NMKR Docs"
[5]: https://github.com/nftmakerio/NMKR-Studio-API-GeneratorTS/?utm_source=chatgpt.com "nftmakerio/NMKR-Studio-API-GeneratorTS - GitHub"
[6]: https://libraries.io/npm/nmkr-studio-api?utm_source=chatgpt.com "nmkr-studio-api on NPM - Libraries.io"
[7]: https://www.jsdelivr.com/package/npm/nmkr-studio-api?utm_source=chatgpt.com "nmkr-studio-api CDN by jsDelivr - A CDN for npm and GitHub"
[8]: https://snyk.io/advisor/npm-package/nmkr-studio-api?utm_source=chatgpt.com "nmkr-studio-api - npm Package Health Analysis | Snyk"


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
