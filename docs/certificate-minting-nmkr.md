# Certificate Minting with NMKR API

## Overview

The `build-certificate-tx-nmkr.mjs` utility provides an alternative certificate minting approach using the NMKR Studio API instead of direct Cardano transaction building. This approach simplifies the minting process by leveraging NMKR's hosted infrastructure.

## Features

- **Template-based metadata**: Uses the same `certificate-metadata.mjs` utility and `templates/class-certificate.json` template
- **NMKR API integration**: Leverages NMKR Studio API for NFT upload and deterministic minting
- **Deterministic minting**: Uses `MintAndSendSpecific` to ensure exact NFT selection rather than random selection
- **Metadata override**: Applies structured metadata directly to the NFT instead of using placeholders
- **Network support**: Supports both mainnet and preprod networks
- **Transaction tracking**: Returns explorer URLs for transaction monitoring
- **Error handling**: Comprehensive error handling for API failures

## Usage

```bash
node build-certificate-tx-nmkr.mjs recipientAddress nftName serialNum projectUid imageUrl metadata
```

### Parameters

1. **recipientAddress** (string): Cardano wallet address to receive the certificate
2. **nftName** (string): Base name for the certificate NFT
3. **serialNum** (string): Serial number for the certificate
4. **projectUid** (string): NMKR project UID where the certificate will be minted
5. **imageUrl** (string): IPFS URL for the certificate image
6. **metadata** (JSON string): Certificate metadata containing course and student details

### Environment Variables

Required environment variables:

- `NMKR_API_KEY`: Your NMKR Studio API key
- `NETWORK`: Network to use ('mainnet' or 'preprod', defaults to 'preprod')

## Example

```bash
export NMKR_API_KEY="your_nmkr_api_key_here"
export NETWORK="preprod"

node build-certificate-tx-nmkr.mjs \
  "addr_test1qp..." \
  "web3-course" \
  "001" \
  "proj_12345..." \
  "QmHash123..." \
  '{"course_title":"Web3 Development","student_name":"John Doe","teacher_name":"Jane Smith","completion_date":"2025-09-14","serial_number":"001"}'
```

## Response Format

### Success Response

```json
{
  "status": 200,
  "nftUid": "nft_12345...",
  "nftName": "web3-course",
  "serialNum": "001",
  "recipientAddress": "addr_test1qp...",
  "transactionUrl": "https://preprod.cardanoscan.io/transaction/abc123...",
  "transactionHash": "abc123...",
  "mintResult": { /* NMKR mint response with sendedNft array */ },
  "metadata": { /* Original metadata */ },
  "nmkrProjectUid": "proj_12345...",
  "mintedNftDetails": { /* Details of the minted NFT from sendedNft[0] */ }
}
```

### Error Response

```json
{
  "status": 500,
  "error": "Error message describing what went wrong"
}
```

## NMKR API Flow

1. **Upload NFT**: Creates NFT asset in NMKR project with metadata override
2. **Mint Specific**: Uses `MintAndSendSpecific` to mint the exact NFT created in step 1
3. **Return Details**: Provides transaction hash and explorer URL for tracking

This deterministic approach ensures:

- Exact metadata control through `metadataOverride`
- Predictable NFT selection via specific UID targeting
- Consistent certificate generation without randomness

## Comparison with Direct Minting

| Feature | Direct Minting | NMKR API (Deterministic) |
|---------|----------------|---------------------------|
| **Complexity** | High | Medium |
| **Infrastructure** | Self-hosted | NMKR-hosted |
| **Transaction fees** | Manual calculation | Handled by NMKR |
| **Error handling** | Manual | Built-in |
| **Metadata validation** | Manual | Automatic |
| **Network management** | Manual | Simplified |
| **NFT Selection** | Manual | Deterministic via UID |
| **Metadata Control** | Full CIP-25 | Override + Template |

## Integration Notes

- Uses the same metadata template system as the direct minting approach
- Maintains compatibility with existing certificate metadata structure
- Can be used as a drop-in replacement for `build-certificate-tx.mjs`
- Returns enhanced response format with deterministic NFT details
- Leverages `metadataOverride` for precise metadata control instead of placeholders
- Uses `MintAndSendSpecific` to ensure exact NFT selection rather than random minting
