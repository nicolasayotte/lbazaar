import {
  Address,
  Assets,
  bytesToHex,
  CoinSelection,
  hexToBytes,
  NetworkParams,
  Program,
  PubKeyHash,
  textToBytes,
  Tx,
  TxOutput,
  UTxO,
  Value
} from '@hyperionbt/helios';
import fs from 'fs/promises';
import { buildCIP25Metadata, buildCustomMetadata } from '../common/certificate-metadata.mjs';
import { getNetworkParams } from '../common/utils.mjs';

const network = process.env.NETWORK || 'preprod';
const optimize = false;

/**
 * Main function to build certificate minting transaction
 * Usage: node build-certificate-tx.mjs recipientAddress nftName serialNum mph imageUrl metadata
 * @params {string, string, string, string, string, string}
 * @output {string} JSON response with transaction details
 */
const main = async () => {
  try {
    const args = process.argv;
    const recipientAddress = args[2];
    const nftName = args[3];
    const serialNum = args[4];
    const mph = args[5];
    const imageUrl = args[6];
    const metadataJson = args[7];

    const ownerPkh = process.env.OWNER_PKH;
    const nmkrPkh = process.env.NMKR_PKH || ownerPkh; // Fallback to owner PKH if NMKR_PKH not set
    const minAda = BigInt(process.env.MIN_ADA);
    const maxTxFee = BigInt(process.env.MAX_TX_FEE);
    const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);
    const useMultiSig = process.env.NMKR_PKH ? true : false; // Use multi-sig policy if NMKR_PKH is set

    if (!recipientAddress || !nftName || !serialNum || !mph || !imageUrl) {
      throw new Error('Missing required parameters');
    }

    // Parse metadata
    const metadata = JSON.parse(metadataJson);

    // Create the certificate token names
    const certificateTokenNameRef = '(100)' + nftName + '|' + serialNum;
    const certificateTokenName = '(222)' + nftName + '|' + serialNum;

    // Set validity interval
    const ttl = parseInt(process.env.TTL_MINUTES || '30');
    const now = new Date();
    const before = new Date(now.getTime() - (ttl * 60 * 1000));
    const after = new Date(now.getTime() + (ttl * 60 * 1000));

    // Get recipient address
    const recipientAddr = Address.fromBech32(recipientAddress);

    // Load and compile the NFT minting policy
    const policyFileName = useMultiSig ? 'nft-minting-policy-multi-sig.hl' : 'nft-minting-policy.hl';
    const nftMintingPolicyFile = await fs.readFile(`./contracts/${policyFileName}`, 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    if (useMultiSig) {
      nftMintingProgram.parameters = { ['NMKR_PKH']: nmkrPkh };
    }
    nftMintingProgram.parameters = { ['VERSION']: '1.0' };

    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;

    // Verify the minting policy hash matches (if provided)
    if (mph && nftTokenMPH.hex !== mph) {
      throw new Error('Certificate Token minting policy hash does not match');
    }

    // Get owner wallet UTXOs (we'll use owner wallet to pay for minting)
    const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;
    const ownerUtxosCmd = 'node ../common/get-owner-utxos.mjs';
    const ownerUtxosResponse = require('child_process').execSync(ownerUtxosCmd, { encoding: 'utf8' });
    const ownerUtxosData = JSON.parse(ownerUtxosResponse);

    if (ownerUtxosData.status !== 200) {
      throw new Error('Failed to get owner UTXOs: ' + ownerUtxosData.error);
    }

    const walletUtxos = ownerUtxosData.utxos.map((u) => UTxO.fromCbor(hexToBytes(u)));
    const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt);
    const utxos = CoinSelection.selectLargestFirst(walletUtxos, minUTXOVal);

    if (utxos.length === 0) {
      throw new Error('Insufficient funds in owner wallet for certificate minting');
    }

    // Start building the transaction
    const tx = new Tx();

    // Add the UTXO as inputs
    tx.addInputs(utxos[0]);

    // Attach the script as a witness to the transaction
    tx.attachScript(compiledNftMintingProgram);

    // Create the certificate mint redeemer
    const nftRedeemer = new nftMintingProgram.types.Redeemer.Mint()._toUplcData();

    // Create the certificate tokens
    const nftTokens = [
      [textToBytes(certificateTokenNameRef), BigInt(1)],
      [textToBytes(certificateTokenName), BigInt(1)],
    ];

    // Add the mint to the tx
    tx.mintTokens(nftTokenMPH, nftTokens, nftRedeemer);

    // Send the certificate NFT to the recipient
    tx.addOutput(
      new TxOutput(
        recipientAddr,
        new Value(minAda, new Assets([[nftTokenMPH, new Map([[textToBytes(certificateTokenName), BigInt(1)]])]]))
      ),
    );

    // Send the reference token to the owner (for metadata/verification purposes)
    tx.addOutput(
      new TxOutput(
        Address.fromBech32(ownerWalletAddr),
        new Value(minAda, new Assets([[nftTokenMPH, new Map([[textToBytes(certificateTokenNameRef), BigInt(1)]])]]))
      ),
    );

    // Set validity interval
    tx.validFrom(before);
    tx.validTo(after);

    // Add owner pkh as a signer (required to mint the certificate)
    tx.addSigner(PubKeyHash.fromHex(ownerPkh));

    // Add certificate metadata (CIP-25)
    const policyId = nftTokenMPH.hex;
    const assetName = Buffer.from(certificateTokenName, 'utf-8').toString('hex');

    const cip25Metadata = await buildCIP25Metadata(policyId, assetName, metadata, imageUrl);
    tx.addMetadata(721, cip25Metadata);

    // Add custom metadata for certificate details
    const customMetadata = buildCustomMetadata(metadata);
    tx.addMetadata(674, customMetadata);

    // Finalize the transaction
    const networkParamsFile = await getNetworkParams(network);
    const networkParams = new NetworkParams(JSON.parse(networkParamsFile));

    const ownerAddr = Address.fromBech32(ownerWalletAddr);
    await tx.finalize(networkParams, ownerAddr, utxos[1]);

    const returnObj = {
      status: 200,
      cborTx: bytesToHex(tx.toCbor()),
      nftName: nftName,
      serialNum: serialNum,
      mph: nftTokenMPH.hex,
      recipientAddress: recipientAddress,
      metadata: metadata
    };

    console.error('build-certificate-tx: success');
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err
    };
    console.error('build-certificate-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
