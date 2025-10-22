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
