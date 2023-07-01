import { promises as fs } from 'fs';

import {
    Address, 
    Assets, 
    bytesToHex, 
    CoinSelection,
    ConstrData, 
    hexToBytes, 
    NetworkParams,
    Program, 
    PubKeyHash,
    Value, 
    textToBytes,
    TxOutput,
    Tx, 
    UTxO 
} from "@hyperionbt/helios";

import { signTx } from "../common/sign-tx.mjs";
import { getNetworkParams } from "../common/network.mjs"

//import NFTMintingPolicy from '../contracts/nft-minting-policy.hl';
//import NFTValidator from '../contracts/nft-validator.hl';

/**
 * Main calling function via the command line 
 * Usage: node exchange-tx.js cBorChangeAddr [cborUtxo1,cborUtxo2,...]
 * @params {string, string, string[]}
 * @output {string} cborTx
 */
const main = async () => {

    try {
        // Set the Helios compiler optimizer flag
        const optimize = (process.env.OPTIMIZE === 'true');
        const network = process.env.NETWORK;
        const ownerPkh = process.env.OWNER_PKH;
        const minAda = BigInt(process.env.MIN_ADA);  // minimum lovelace needed to send an NFT
        const maxTxFee = BigInt(process.env.MAX_TX_FEE);
        const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);
        const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt);
        const args = process.argv;
        const stakeKeyHash = args[2]
        const hexChangeAddr = args[3];
        const cborUtxos = args[4].split(',');
        const nftTokenName = process.env.NFT_TOKEN_NAME;
  
        // Get the change address from the wallet
        const changeAddr = Address.fromHex(hexChangeAddr);

        if (!(stakeKeyHash === changeAddr.stakingHash.hex)) {
            throw console.error("exchange-tx.mjs: stake key hash does not match with verified stake key");
        }

        // Get UTXOs from wallet
        const walletUtxos = cborUtxos.map(u => UTxO.fromCbor(hexToBytes(u)));
        const utxos = CoinSelection.selectSmallestFirst(walletUtxos, minUTXOVal);

        // Start building the transaction
        const tx = new Tx();

        // Add the UTXO as inputs
        tx.addInputs(utxos[0]);

        // Add the script as a witness to the transaction
        const nftMintingPolicyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
        const nftMintingPolicyScript = nftMintingPolicyFile.toString();
        const nftMintingProgram  = Program.new(nftMintingPolicyScript);
        //const nftMintingProgram = new NFTMintingPolicy();
        nftMintingProgram.parameters = {["OWNER_PKH"] : ownerPkh};
        nftMintingProgram.parameters = {["VERSION"] : "1.0"};
        const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
        const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;
        tx.attachScript(compiledNftMintingProgram);

        // Create the nft mint redeemer
        const nftRedeemer = (new nftMintingProgram.types.Redeemer.Mint())._toUplcData();

        // Create the nft token that will be sent to the user
        // and the soul bound token
        const nftTokens = [[textToBytes(nftTokenName), BigInt(2)]];
        
        // Add the mint to the tx
        tx.mintTokens(
            nftTokenMPH,
            nftTokens,
            nftRedeemer
        )

        // Attach the output with the minted nft token to the destination address
        const nftToken = [[textToBytes(nftTokenName), BigInt(1)]];
        tx.addOutput(new TxOutput(
            changeAddr,
            new Value(minAda, new Assets([[nftTokenMPH, nftToken]]))
          ));

        // Construct the nft validator output address
        const nftValFile = await fs.readFile('./contracts/nft-validator.hl', 'utf8');
        const nftValScript = nftValFile.toString();
        const nftValProgram  = Program.new(nftValScript);
        //const nftValProgram = new NFTValidator();
        nftValProgram.parameters = {["OWNER_PKH"] : ownerPkh};
        nftValProgram.parameters = {["VERSION"] : "1.0"};
        const compiledNftValProgram = nftValProgram.compile(optimize);
        const nftValHash = compiledNftValProgram.validatorHash;

        // Create the output for the soul-bound token
        tx.addOutput(new TxOutput(
            Address.fromHashes(nftValHash),
            new Value(minAda, new Assets([[nftTokenMPH, nftToken]]))
        ));

        // Add owner pkh as a signer which is required to mint the nft
        tx.addSigner(PubKeyHash.fromHex(ownerPkh));

        // Add both the spending and the verified staking key so they 
        // are signed as part of this transaction
        tx.addSigner(changeAddr.pubKeyHash);
        //tx.addSigner(changeAddr.stakingHash);

        // Attached the metadata for the minting transaction

        console.error("addr: ", changeAddr.toBech32());
        
        tx.addMetadata(721, {"map": [[nftTokenMPH.hex, 
                                {"map": [[nftTokenName,
                                    {
                                    "map": [["pub_key_hash", changeAddr.pubKeyHash.hex],
                                            ["stake_key_hash", changeAddr.stakingHash.hex]]
                                    }
                                ]]}
                            ]]}
                        ); 
                        
         
        // Network Params
        const networkParamsPreview = await getNetworkParams(network);
        const networkParams = new NetworkParams(JSON.parse(networkParamsPreview));
        
        // Send any change back to the buyer
        await tx.finalize(networkParams, changeAddr, utxos[1]);

        // Add the signature from the server side private key
        // This way, we lock the transaction now and then need
        // the end user to sign the tx.
        const txSigned = await signTx(tx);

        const returnObj = {
            status: 200,
            cborTx: bytesToHex(txSigned.toCbor())
        }
        process.stdout.write(JSON.stringify(returnObj));

    } catch (err) {
        const returnObj = {
            status: 500
        }
        var timestamp = new Date().toISOString();
        console.error(timestamp);
        console.error("exchange-tx: ", err);
        process.stdout.write(JSON.stringify(returnObj));
    }
}

main();


  