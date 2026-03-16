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
  TxInput,
  TxOutput,
  Value
} from '@hyperionbt/helios';
import fs from 'fs/promises';
import { buildCIP25Metadata, buildCustomMetadata } from '../common/certificate-metadata.mjs';
import { getNetworkParams } from '../common/network.mjs';
import { fetchUtxos } from '../common/get-owner-utxos.mjs';

const network = process.env.NETWORK || 'preprod';
const optimize = false;

/**
 * Main function to build certificate minting transaction.
 * Optionally includes a fungible token reward in the same transaction (F-07).
 *
 * Usage: node build-certificate-tx.mjs recipientAddress nftName serialNum imageUrl metadata [tokenName tokenQuantity]
 *
 * When tokenName and tokenQuantity are provided, the fungible token reward is
 * minted and sent to the same recipient in the same on-chain transaction.
 *
 * @output {string} JSON response with transaction details
 */
const main = async () => {
  try {
    const args = process.argv;
    const recipientAddress = args[2];
    const nftName = args[3];
    const serialNum = args[4];
    const imageUrl = args[5];
    const metadataJson = args[6];
    // Optional token reward args (F-07)
    const tokenName     = args[7] || null;
    const tokenQuantity = args[8] ? BigInt(args[8]) : null;

    const ownerPkh = process.env.OWNER_PKH;
    const lockDate = process.env.CERTIFICATE_LOCK_DATE;
    const minAda = BigInt(process.env.MIN_ADA);
    const maxTxFee = BigInt(process.env.MAX_TX_FEE);
    const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);

    if (!recipientAddress || !nftName || !serialNum || !imageUrl) {
      throw new Error('Missing required parameters');
    }
    if (!lockDate) {
      throw new Error('CERTIFICATE_LOCK_DATE env var required');
    }

    const includeToken = tokenName !== null && tokenQuantity !== null && tokenQuantity > 0n;

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
    const policyFileName = 'nft-minting-policy.hl';
    const nftMintingPolicyFile = await fs.readFile(`./contracts/${policyFileName}`, 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);

    const lockTimestamp = new Date(lockDate).getTime();
    if (isNaN(lockTimestamp)) {
      throw new Error('Invalid CERTIFICATE_LOCK_DATE format');
    }

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    nftMintingProgram.parameters = { ['LOCK_DATE']: BigInt(lockTimestamp) };

    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;

    // Get owner wallet UTXOs (platform wallet pays for airdrop minting)
    const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;
    if (!ownerWalletAddr) {
      throw new Error('OWNER_WALLET_ADDR env var required');
    }

    const utxoCborHexes = await fetchUtxos(ownerWalletAddr);
    const walletUtxos = utxoCborHexes.map((u) => TxInput.fromFullCbor(hexToBytes(u)));
    // When also sending token reward, budget for the extra output's min ADA
    const extraOutputs = includeToken ? 1n : 0n;
    const minUTXOVal = new Value(minAda * (2n + extraOutputs) + maxTxFee + minChangeAmt);
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

    // Build token list: certificate tokens + optional fungible token reward
    const nftTokens = [
      [textToBytes(certificateTokenNameRef), BigInt(1)],
      [textToBytes(certificateTokenName), BigInt(1)],
    ];

    if (includeToken) {
      nftTokens.push([textToBytes(tokenName), tokenQuantity]);
    }

    // Add the mint to the tx (single mintTokens call with all tokens under same policy)
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

    // F-07: If token reward is included, send it to the same recipient in this transaction
    if (includeToken) {
      const tokenBytes = textToBytes(tokenName);
      tx.addOutput(
        new TxOutput(
          recipientAddr,
          new Value(minAda, new Assets([[nftTokenMPH, new Map([[tokenBytes, tokenQuantity]])]]))
        ),
      );
    }

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
      metadata: metadata,
      tokenIncluded: includeToken,
      tokenName: includeToken ? tokenName : null,
      tokenQuantity: includeToken ? tokenQuantity.toString() : null,
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
