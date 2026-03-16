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
import { toHeliosMetadata } from '../common/certificate-metadata.mjs';
import { getNetworkParams } from '../common/network.mjs';
import { fetchUtxos } from '../common/get-owner-utxos.mjs';
import { signTx, submitTx } from '../common/sign-tx.mjs';

const network = process.env.NETWORK || 'preprod';
const optimize = false;

/**
 * Build and submit an on-chain metadata update transaction that flags an NFT as revoked.
 *
 * Since Cardano NFT metadata is immutable (it is stored in the minting transaction),
 * the CIP-25 revocation pattern is to submit a new transaction from the owner wallet
 * that carries updated CIP-25 metadata for the same policy ID + asset name, adding
 * { revoked: true, revoked_at: <timestamp> }. Off-chain indexers and the platform
 * treat the most-recent metadata tx for a policy + asset as authoritative.
 *
 * The transaction also burns the reference token (100) to signal permanent revocation
 * of the certificate to on-chain verifiers, subject to the minting policy allowing
 * a burn before the lock date. If the lock date has passed, only the metadata tx is
 * emitted (burn is skipped) and the revocation is recorded via metadata only.
 *
 * Usage: node revoke-certificate-tx.mjs <nftName> <serialNum> <policyId> <courseHistoryId>
 * Env:   OWNER_PKH, OWNER_WALLET_ADDR, CERTIFICATE_LOCK_DATE, MIN_ADA, MAX_TX_FEE, MIN_CHANGE_AMT
 *
 * Output: JSON { status: 200, txHash } | { status: 500, error }
 */
const main = async () => {
  try {
    const args = process.argv;
    const nftName        = args[2];
    const serialNum      = args[3];
    const policyIdHex    = args[4];
    const courseHistoryId = args[5];

    if (!nftName || !serialNum || !policyIdHex) {
      throw new Error('Usage: node revoke-certificate-tx.mjs <nftName> <serialNum> <policyId> [courseHistoryId]');
    }

    const ownerPkh        = process.env.OWNER_PKH;
    const ownerWalletAddr = process.env.OWNER_WALLET_ADDR;
    const lockDate        = process.env.CERTIFICATE_LOCK_DATE;
    const minAda          = BigInt(process.env.MIN_ADA ?? '2000000');
    const maxTxFee        = BigInt(process.env.MAX_TX_FEE ?? '500000');
    const minChangeAmt    = BigInt(process.env.MIN_CHANGE_AMT ?? '1000000');

    if (!ownerPkh)        throw new Error('OWNER_PKH env var required');
    if (!ownerWalletAddr) throw new Error('OWNER_WALLET_ADDR env var required');
    if (!lockDate)        throw new Error('CERTIFICATE_LOCK_DATE env var required');

    const revokedAt = new Date().toISOString();

    // Load and compile the minting policy to get the policy hash
    const policyFileName = 'nft-minting-policy.hl';
    const nftMintingPolicyFile = await fs.readFile(`./contracts/${policyFileName}`, 'utf8');
    const nftMintingProgram = Program.new(nftMintingPolicyFile.toString());

    const lockTimestamp = new Date(lockDate).getTime();
    if (isNaN(lockTimestamp)) {
      throw new Error('Invalid CERTIFICATE_LOCK_DATE format');
    }

    nftMintingProgram.parameters = { ['OWNER_PKH']: ownerPkh };
    nftMintingProgram.parameters = { ['LOCK_DATE']: BigInt(lockTimestamp) };

    const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
    const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;

    // Verify the compiled policy matches the provided policyId
    if (nftTokenMPH.hex !== policyIdHex) {
      throw new Error(
        `Policy ID mismatch: expected ${policyIdHex}, compiled ${nftTokenMPH.hex}. ` +
        'Ensure OWNER_PKH and CERTIFICATE_LOCK_DATE match the original minting parameters.'
      );
    }

    // Fetch owner wallet UTXOs
    const utxoCborHexes = await fetchUtxos(ownerWalletAddr);
    const walletUtxos   = utxoCborHexes.map((u) => TxInput.fromFullCbor(hexToBytes(u)));
    const minUTXOVal    = new Value(minAda + maxTxFee + minChangeAmt);
    const utxos         = CoinSelection.selectLargestFirst(walletUtxos, minUTXOVal);

    if (utxos.length === 0) {
      throw new Error('Insufficient funds in owner wallet for revocation transaction');
    }

    // Build the token names (matching the original minting pattern)
    const certificateTokenNameRef = '(100)' + nftName + '|' + serialNum;
    const certificateTokenName    = '(222)' + nftName + '|' + serialNum;

    // Set validity interval
    const ttl    = parseInt(process.env.TTL_MINUTES || '30');
    const now    = new Date();
    const before = new Date(now.getTime() - (ttl * 60 * 1000));
    const after  = new Date(now.getTime() + (ttl * 60 * 1000));

    const ownerAddr = Address.fromBech32(ownerWalletAddr);

    // Build the transaction
    const tx = new Tx();

    tx.addInputs(utxos[0]);
    tx.addSigner(PubKeyHash.fromHex(ownerPkh));

    tx.validFrom(before);
    tx.validTo(after);

    // Check whether the lock date has passed. If not, attempt to burn the reference token.
    const now_ms   = Date.now();
    const canBurn  = now_ms < lockTimestamp;

    if (canBurn) {
      // Attach the minting script and burn the reference token
      tx.attachScript(compiledNftMintingProgram);
      const burnRedeemer = new nftMintingProgram.types.Redeemer.Burn()._toUplcData();
      tx.mintTokens(nftTokenMPH, [[textToBytes(certificateTokenNameRef), BigInt(-1)]], burnRedeemer);
    }

    // Build CIP-25 revocation metadata:
    // Same policy + asset name as original mint, but metadata now includes revoked fields.
    const assetNameHex = Buffer.from(certificateTokenName, 'utf-8').toString('hex');

    const revocationMetadata = toHeliosMetadata({
      [nftTokenMPH.hex]: {
        [assetNameHex]: {
          revoked:    true,
          revoked_at: revokedAt,
          course_history_id: courseHistoryId ?? '',
          name: nftName,
        }
      },
      version: 1
    });

    tx.addMetadata(721, revocationMetadata);

    // Add a minimal self-output so the tx is valid even without burn
    tx.addOutput(
      new TxOutput(ownerAddr, new Value(minAda))
    );

    // Finalize
    const networkParamsFile = await getNetworkParams(network);
    const networkParams     = new NetworkParams(JSON.parse(networkParamsFile));
    await tx.finalize(networkParams, ownerAddr, utxos[1]);

    // Sign and submit using owner key
    const signedTx = await signTx(tx, 0);
    const txId     = await submitTx(signedTx);

    const returnObj = {
      status:    200,
      txHash:    txId,
      nftName,
      serialNum,
      policyId:  nftTokenMPH.hex,
      revokedAt,
      burned:    canBurn,
    };

    console.error('revoke-certificate-tx: success', txId);
    process.stdout.write(JSON.stringify(returnObj));

  } catch (err) {
    const returnObj = {
      status: 500,
      error:  err.message || String(err),
    };
    console.error('revoke-certificate-tx: error', err);
    process.stdout.write(JSON.stringify(returnObj));
  }
};

main();
