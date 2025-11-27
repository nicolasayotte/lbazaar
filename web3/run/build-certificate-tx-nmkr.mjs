import { buildCertificateMetadata } from '../common/certificate-metadata.mjs';
import { getMintingPolicyHash } from '../common/minting-policy.mjs';

const network = process.env.NETWORK || 'preprod';

/**
 * Main function to build certificate minting transaction using NMKR API
 * Usage: node build-certificate-tx-nmkr.mjs recipientAddress nftName serialNum projectUid imageUrl metadata
 * @params {string, string, string, string, string, string}
 * @output {string} JSON response with transaction URL and details
 */
const main = async () => {
  try {
    const args = process.argv;
    const recipientAddress = args[2];
    const nftName = args[3];
    const serialNum = args[4];
    const projectUid = args[5];
    const imageUrl = args[6];
    const metadataJson = args[7];

    const nmkrApiKey = process.env.NMKR_API_KEY;
    const nmkrBaseUrl = network === 'mainnet'
      ? 'https://studio-api.nmkr.io/v2'
      : 'https://studio-api.preprod.nmkr.io/v2';

    if (!recipientAddress || !nftName || !serialNum || !projectUid || !imageUrl || !nmkrApiKey) {
      throw new Error('Missing required parameters or NMKR_API_KEY environment variable');
    }

    // Parse metadata
    const metadata = JSON.parse(metadataJson);

    // Create the certificate token name
    const certificateTokenName = '(222)' + nftName + '|' + serialNum;

    // Build certificate metadata using the template
    const assetNameHex = Buffer.from(certificateTokenName, 'utf-8').toString('hex');
    const certificateMetadata = await buildCertificateMetadata(metadata, assetNameHex, imageUrl);

    // Get the first asset from the certificate metadata (since template uses {{asset_name}} as key)
    const firstAssetKey = Object.keys(certificateMetadata)[0];
    const nftMetadata = certificateMetadata[firstAssetKey];

    // Upload NFT to NMKR with metadata override
    const uploadResponse = await fetch(`${nmkrBaseUrl}/UploadNft/${projectUid}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nmkrApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tokenname: certificateTokenName,
        displayname: nftMetadata.name || `Certificate - ${metadata.course_title}`,
        previewImageNft: {
          mimetype: 'image/png',
          fileFromsUrl: imageUrl.startsWith('ipfs://') ? imageUrl : `ipfs://${imageUrl}`
        },
        metadataOverride: JSON.stringify(nftMetadata)
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`NMKR Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.nftUid) {
      throw new Error('NMKR Upload failed: No NFT UID returned');
    }

    // For certificates, we use deterministic minting to ensure specific NFT selection
    // Mint and send the specific NFT directly to the recipient
    const mintResponse = await fetch(`${nmkrBaseUrl}/MintAndSendSpecific/${projectUid}/${uploadResult.nftUid}/1/${recipientAddress}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nmkrApiKey}`
      }
    });

    if (!mintResponse.ok) {
      const errorText = await mintResponse.text();
      throw new Error(`NMKR Minting failed: ${mintResponse.status} - ${errorText}`);
    }

    const mintResult = await mintResponse.json();

    // Build transaction URL for tracking
    const explorerBaseUrl = network === 'mainnet'
      ? 'https://cardanoscan.io/transaction'
      : 'https://preprod.cardanoscan.io/transaction';

    // Get the minting policy hash for consistency with direct minting
    const mintingPolicyHash = await getMintingPolicyHash();

    const returnObj = {
      status: 200,
      nftUid: uploadResult.nftUid,
      nftName: nftName,
      serialNum: serialNum,
      recipientAddress: recipientAddress,
      transactionUrl: mintResult.sendedNft && mintResult.sendedNft[0] && mintResult.sendedNft[0].initialMintTxHash
        ? `${explorerBaseUrl}/${mintResult.sendedNft[0].initialMintTxHash}`
        : null,
      transactionHash: mintResult.sendedNft && mintResult.sendedNft[0] && mintResult.sendedNft[0].initialMintTxHash 
        ? mintResult.sendedNft[0].initialMintTxHash 
        : null,
      mintResult: mintResult,
      metadata: metadata,
      nmkrProjectUid: projectUid,
      mintingPolicyHash: mintingPolicyHash,
      mintedNftDetails: mintResult.sendedNft && mintResult.sendedNft[0] ? mintResult.sendedNft[0] : null
    };

    console.error('build-certificate-tx-nmkr: success');
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err
    };
    console.error('build-certificate-tx-nmkr: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

export { main };

// Auto-execute when run directly (not imported as module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
