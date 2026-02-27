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
import { getNetworkParams } from '../common/utils.mjs';
import { execSync } from 'child_process';

const network = process.env.NETWORK || 'preprod';
const optimize = false;

/**
 * Main function to build token reward minting transaction
 * Usage: node build-token-reward-tx.mjs recipientAddress tokenName quantity mph
 * @params {string, string, string, string}
 * @output {string} JSON response with transaction details
 */
const main = async () => {
  try {
    const args = process.argv;
    const recipientAddress = args[2];
    const tokenName = args[3];
    const quantityStr = args[4];
    const mph = args[5];

    const ownerPkh = process.env.OWNER_PKH;
    const minAda = BigInt(process.env.MIN_ADA);
    const maxTxFee = BigInt(process.env.MAX_TX_FEE);
    const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);

    if (!recipientAddress || !tokenName || !quantityStr || !mph) {
      throw new Error('Missing required parameters: recipientAddress tokenName quantity mph');
    }

    const quantity = BigInt(quantityStr);
    if (quantity < 1n) {
      throw new Error('Quantity must be a positive integer');
    }

    // Set validity interval
    const ttl = parseInt(process.env.TTL_MINUTES || '30');
    const now = new Date();
    const before = new Date(now.getTime() - (ttl * 60 * 1000));
    const after = new Date(now.getTime() + (ttl * 60 * 1000));

    // Get recipient address
    const recipientAddr = Address.fromBech32(recipientAddress);

    // Load and compile the NFT minting policy (same policy as certificates)
    const policyFileName = 'nft-minting-policy.hl';
    const nftMintingPolicyFile = await fs.readFile(`./contracts/${policyFileName}`, 'utf8');
    const nftMintingPolicyScript = nftMintingPolicyFile.toString();
    const nftMintingProgram = Program.new(nftMintingPolicyScript);

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    nftMintingProgram.parameters = { ['VERSION']: '1.0' };

    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;

    // Verify the minting policy hash matches
    if (mph && nftTokenMPH.hex !== mph) {
      throw new Error('Token reward minting policy hash does not match');
    }

    // Get owner wallet UTXOs
    const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;
    const ownerUtxosCmd = 'node ../common/get-owner-utxos.mjs';
    const ownerUtxosResponse = execSync(ownerUtxosCmd, { encoding: 'utf8' });
    const ownerUtxosData = JSON.parse(ownerUtxosResponse);

    if (ownerUtxosData.status !== 200) {
      throw new Error('Failed to get owner UTXOs: ' + ownerUtxosData.error);
    }

    const walletUtxos = ownerUtxosData.utxos.map((u) => UTxO.fromCbor(hexToBytes(u)));
    const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt);
    const utxos = CoinSelection.selectLargestFirst(walletUtxos, minUTXOVal);

    if (utxos.length === 0) {
      throw new Error('Insufficient funds in owner wallet for token reward minting');
    }

    // Start building the transaction
    const tx = new Tx();

    // Add the UTXO as inputs
    tx.addInputs(utxos[0]);

    // Attach the script as a witness to the transaction
    tx.attachScript(compiledNftMintingProgram);

    // Create the token reward mint redeemer
    const nftRedeemer = new nftMintingProgram.types.Redeemer.Mint()._toUplcData();

    // Create the fungible token — single token name, quantity N
    const tokenBytes = textToBytes(tokenName);
    const tokenTokens = [[tokenBytes, quantity]];

    // Add the mint to the tx
    tx.mintTokens(nftTokenMPH, tokenTokens, nftRedeemer);

    // Send the token reward to the recipient (no reference token — fungible)
    tx.addOutput(
      new TxOutput(
        recipientAddr,
        new Value(minAda, new Assets([[nftTokenMPH, new Map([[tokenBytes, quantity]])]]))
      ),
    );

    // Set validity interval
    tx.validFrom(before);
    tx.validTo(after);

    // Add owner pkh as a signer (required to mint)
    tx.addSigner(PubKeyHash.fromHex(ownerPkh));

    // Add label 674 metadata — no CIP-25 image metadata for fungible tokens
    // Parse courseId from tokenName (format: "Token-{courseId}")
    const courseIdMatch = tokenName.match(/^Token-(\d+)$/);
    const courseId = courseIdMatch ? courseIdMatch[1] : tokenName;

    tx.addMetadata(674, {
      msg: [
        'Token reward',
        `Course: ${courseId}`,
        `Quantity: ${quantityStr}`
      ]
    });

    // Finalize the transaction
    const networkParamsFile = await getNetworkParams(network);
    const networkParams = new NetworkParams(JSON.parse(networkParamsFile));

    const ownerAddr = Address.fromBech32(ownerWalletAddr);
    await tx.finalize(networkParams, ownerAddr, utxos[1]);

    const returnObj = {
      status: 200,
      cborTx: bytesToHex(tx.toCbor()),
      tokenName: tokenName,
      quantity: quantityStr,
      mph: nftTokenMPH.hex,
      recipientAddress: recipientAddress
    };

    console.error('build-token-reward-tx: success');
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err
    };
    console.error('build-token-reward-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
