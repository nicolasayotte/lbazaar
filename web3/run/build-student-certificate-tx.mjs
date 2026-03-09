import {
  Address,
  Assets,
  bytesToHex,
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
import { signTx } from '../common/sign-tx.mjs';

const network = process.env.NETWORK || 'preprod';
const optimize = false;

/**
 * Build a certificate minting transaction paid by the student's wallet.
 * The owner signs the tx (minting policy requires OWNER_PKH).
 * The student then co-signs via CIP-30 and submits.
 *
 * Usage: node build-student-certificate-tx.mjs \
 *   studentAddress studentUtxosCbor nftName serialNum imageUrl metadataJson
 */
const main = async () => {
  try {
    const args = process.argv;
    const studentAddress = args[2];
    const utxoFilePath   = args[3]; // path to JSON file containing UTXOs array
    const nftName        = args[4];
    const serialNum      = args[5];
    const imageUrl       = args[6];
    const metadataJson   = args[7];

    const ownerPkh     = process.env.OWNER_PKH;
    const lockDate     = process.env.CERTIFICATE_LOCK_DATE;
    const minAda       = BigInt(process.env.MIN_ADA);
    const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;

    if (!studentAddress || !utxoFilePath || !nftName || !serialNum || !imageUrl) {
      throw new Error('Missing required parameters');
    }
    if (!lockDate) {
      throw new Error('CERTIFICATE_LOCK_DATE env var required');
    }

    const metadata = JSON.parse(metadataJson);

    // Token names
    const certificateTokenNameRef = '(100)' + nftName + '|' + serialNum;
    const certificateTokenName    = '(222)' + nftName + '|' + serialNum;

    // Validity interval
    const ttl    = parseInt(process.env.TTL_MINUTES || '30');
    const now    = new Date();
    const before = new Date(now.getTime() - (ttl * 60 * 1000));
    const after  = new Date(now.getTime() + (ttl * 60 * 1000));

    // Address — CIP-30 sends hex, convert to Address object
    const studentAddr = studentAddress.startsWith('addr')
      ? Address.fromBech32(studentAddress)
      : Address.fromHex(studentAddress);

    // Compile minting policy
    const policyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
    const program    = Program.new(policyFile.toString());

    const lockTimestamp = new Date(lockDate).getTime();
    if (isNaN(lockTimestamp)) {
      throw new Error('Invalid CERTIFICATE_LOCK_DATE format');
    }

    program.parameters = { ['OWNER_PKH']: ownerPkh };
    program.parameters = { ['LOCK_DATE']: BigInt(lockTimestamp) };

    const compiled    = program.compile(optimize);
    const nftTokenMPH = compiled.mintingPolicyHash;

    // Read student UTXOs from temp file (JSON array of CBOR hex strings from CIP-30)
    const utxoFileContent = await fs.readFile(utxoFilePath, 'utf8');
    const utxoCborList = JSON.parse(utxoFileContent);
    console.error('UTXOs received:', utxoCborList.length, 'first 40 chars:', utxoCborList[0]?.substring(0, 40));
    // CIP-30 getUtxos() returns TransactionUnspentOutput = [TxInput, TxOutput]
    // Helios needs TxInput.fromFullCbor() to parse this format
    const studentUtxos = utxoCborList.map((cbor) => TxInput.fromFullCbor(hexToBytes(cbor)));

    if (studentUtxos.length === 0) {
      throw new Error('No UTXOs provided from student wallet');
    }

    // Build transaction
    const tx = new Tx();

    // Add student UTXOs as inputs (student pays)
    tx.addInputs(studentUtxos);

    // Attach minting script
    tx.attachScript(compiled);

    // Mint redeemer
    const nftRedeemer = new program.types.Redeemer.Mint()._toUplcData();

    // Mint certificate tokens (reference + actual)
    const nftTokens = [
      [textToBytes(certificateTokenNameRef), BigInt(1)],
      [textToBytes(certificateTokenName),    BigInt(1)],
    ];
    tx.mintTokens(nftTokenMPH, nftTokens, nftRedeemer);

    // Send certificate NFT to student
    tx.addOutput(
      new TxOutput(
        studentAddr,
        new Value(minAda, new Assets([[nftTokenMPH, [[textToBytes(certificateTokenName), BigInt(1)]]]]))
      ),
    );

    // Send reference token to owner
    tx.addOutput(
      new TxOutput(
        Address.fromBech32(ownerWalletAddr),
        new Value(minAda, new Assets([[nftTokenMPH, [[textToBytes(certificateTokenNameRef), BigInt(1)]]]]))
      ),
    );

    // Validity interval
    tx.validFrom(before);
    tx.validTo(after);

    // Owner must sign (minting policy requirement)
    tx.addSigner(PubKeyHash.fromHex(ownerPkh));

    // CIP-25 metadata (label 721)
    const policyId  = nftTokenMPH.hex;
    const assetName = Buffer.from(certificateTokenName, 'utf-8').toString('hex');
    const cip25Metadata = await buildCIP25Metadata(policyId, assetName, metadata, imageUrl);
    tx.addMetadata(721, cip25Metadata);

    // Custom metadata (label 674)
    const customMetadata = buildCustomMetadata(metadata);
    tx.addMetadata(674, customMetadata);

    // Finalize with student as change address
    const networkParamsFile = await getNetworkParams(network);
    const networkParams     = new NetworkParams(JSON.parse(networkParamsFile));
    await tx.finalize(networkParams, studentAddr);

    // Owner signs (partial — student will co-sign via CIP-30)
    const signedTx = await signTx(tx, 0);

    const returnObj = {
      status: 200,
      cborTx: bytesToHex(signedTx.toCbor()),
      nftName,
      serialNum,
      mph: nftTokenMPH.hex,
      recipientAddress: studentAddress,
      metadata,
    };

    console.error('build-student-certificate-tx: success');
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err?.message || String(err),
    };
    console.error('build-student-certificate-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
