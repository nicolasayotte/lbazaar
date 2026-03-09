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
import { getNetworkParams } from '../common/network.mjs';
import { signTx } from '../common/sign-tx.mjs';

const network = process.env.NETWORK || 'preprod';
const optimize = false;

/**
 * Build a token reward minting transaction paid by the student's wallet.
 * The owner signs (minting policy requires OWNER_PKH).
 * The student then co-signs via CIP-30 and submits.
 *
 * Usage: node build-student-token-tx.mjs \
 *   studentAddress studentUtxosCbor tokenName quantity
 */
const main = async () => {
  try {
    const args = process.argv;
    const studentAddress = args[2];
    const utxoFilePath   = args[3]; // path to JSON file containing UTXOs array
    const tokenName      = args[4];
    const quantityStr    = args[5];

    const ownerPkh = process.env.OWNER_PKH;
    const minAda   = BigInt(process.env.MIN_ADA);

    if (!studentAddress || !utxoFilePath || !tokenName || !quantityStr) {
      throw new Error('Missing required parameters: studentAddress utxoFilePath tokenName quantity');
    }

    const quantity = BigInt(quantityStr);
    if (quantity < 1n) {
      throw new Error('Quantity must be a positive integer');
    }

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

    program.parameters = { ['OWNER_PKH']: ownerPkh };
    program.parameters = { ['VERSION']: '1.0' };

    const compiled    = program.compile(optimize);
    const nftTokenMPH = compiled.mintingPolicyHash;

    // Read student UTXOs from temp file (JSON array of CBOR hex strings from CIP-30)
    const utxoFileContent = await fs.readFile(utxoFilePath, 'utf8');
    const utxoCborList = JSON.parse(utxoFileContent);
    console.error('UTXOs received:', utxoCborList.length);
    // CIP-30 getUtxos() returns TransactionUnspentOutput = [TxInput, TxOutput]
    const studentUtxos = utxoCborList.map((cbor) => TxInput.fromFullCbor(hexToBytes(cbor)));

    if (studentUtxos.length === 0) {
      throw new Error('No UTXOs provided from student wallet');
    }

    // Build transaction
    const tx = new Tx();

    tx.addInputs(studentUtxos);
    tx.attachScript(compiled);

    const nftRedeemer = new program.types.Redeemer.Mint()._toUplcData();
    const tokenBytes  = textToBytes(tokenName);
    tx.mintTokens(nftTokenMPH, [[tokenBytes, quantity]], nftRedeemer);

    // Send tokens to student
    tx.addOutput(
      new TxOutput(
        studentAddr,
        new Value(minAda, new Assets([[nftTokenMPH, [[tokenBytes, quantity]]]]))
      ),
    );

    // Validity interval
    tx.validFrom(before);
    tx.validTo(after);

    // Owner must sign
    tx.addSigner(PubKeyHash.fromHex(ownerPkh));

    // Label 674 metadata
    const courseIdMatch = tokenName.match(/^Token-(\d+)$/);
    const courseId      = courseIdMatch ? courseIdMatch[1] : tokenName;
    tx.addMetadata(674, {
      msg: ['Token reward', `Course: ${courseId}`, `Quantity: ${quantityStr}`],
    });

    // Finalize with student as change address
    const networkParamsFile = await getNetworkParams(network);
    const networkParams     = new NetworkParams(JSON.parse(networkParamsFile));
    await tx.finalize(networkParams, studentAddr);

    // Owner signs
    const signedTx = await signTx(tx, 0);

    const returnObj = {
      status: 200,
      cborTx: bytesToHex(signedTx.toCbor()),
      tokenName,
      quantity: quantityStr,
      mph: nftTokenMPH.hex,
      recipientAddress: studentAddress,
    };

    console.error('build-student-token-tx: success');
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error: err.message || err,
    };
    console.error('build-student-token-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
