import { promises as fs } from 'fs';

import {
    Address, 
    Assets, 
    bytesToHex, 
    CoinSelection,
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

// Define time to live for tx validity interval
const ttl = 5; 

/**
 * Main calling function via the command line 
 * Usage: node exchange-tx.js stakeKeyHash cBorChangeAddr imageUrl nftName mph [cborUtxo1,cborUtxo2,...]
 * @params {string, string, string, string, string, string[]}
 * @output {string} cborTx
 */
const main = async () => {

    let canPay = false;
    try {
        const args = process.argv;
        console.error("build-exchange-tx: args: ", args);
        
        // Set the Helios compiler optimizer flag
        const optimize = (process.env.OPTIMIZE === 'true');
        const network = process.env.NETWORK;
        const ownerPkh = process.env.OWNER_PKH;
        const minAda = BigInt(process.env.MIN_ADA);  // minimum lovelace needed to send an NFT
        const maxTxFee = BigInt(process.env.MAX_TX_FEE);
        const minChangeAmt = BigInt(process.env.MIN_CHANGE_AMT);
        const minUTXOVal = new Value(minAda + maxTxFee + minChangeAmt);
        const stakeKeyHash = args[2]
        const hexChangeAddr = args[3];
        const imageUrl = args[4];
        const nftName = args[5];
        const mph = args[6];
        const cborUtxos = args[7].split(',');
        
         // Construct the user token
        const now = new Date();
        const serialNum = now.getTime().toString();
        const nftTokenName = nftName + "|" + serialNum;

        // Set validitity interval
        const before = new Date(now.getTime());
        before.setMinutes(now.getMinutes() - ttl);
        const after = new Date(now.getTime());
        after.setMinutes(now.getMinutes() + ttl);
        
        // Get the change address from the wallet
        const changeAddr = Address.fromHex(hexChangeAddr);

        if (!(stakeKeyHash === changeAddr.stakingHash.hex)) {
            throw console.error("exchange-tx.mjs: stake key hash does not match with verified stake key");
        }

        // Get UTXOs from wallet
        const walletUtxos = cborUtxos.map(u => UTxO.fromCbor(hexToBytes(u)));
        const utxos = CoinSelection.selectSmallestFirst(walletUtxos, minUTXOVal);
        canPay = true;

        // Start building the transaction
        const tx = new Tx();

        // Add the UTXO as inputs
        tx.addInputs(utxos[0]);

        // Add the script as a witness to the transaction
        const nftMintingPolicyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
        const nftMintingPolicyScript = nftMintingPolicyFile.toString();
        const nftMintingProgram  = Program.new(nftMintingPolicyScript);
        nftMintingProgram.parameters = {["OWNER_PKH"] : ownerPkh};
        nftMintingProgram.parameters = {["VERSION"] : "1.0"};
        const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
        const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;
        
        if (nftTokenMPH.hex !== mph) {
            throw console.error("build-exchange-tx: NFT Token minting policy hash does not match")
        }
        tx.attachScript(compiledNftMintingProgram);

        // Create the nft mint redeemer
        const nftRedeemer = (new nftMintingProgram.types.Redeemer.Mint())._toUplcData();

        // Create the nft token that will be sent to the user
        // and the soul bound token
        const nftTokens = [[textToBytes(nftTokenName), BigInt(1)]];
        
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

        // Set a valid time interval
        tx.validFrom(before);
        tx.validTo(after);

        // Add owner pkh as a signer which is required to mint the nft
        tx.addSigner(PubKeyHash.fromHex(ownerPkh));

        // Also add the user wallet as signer as well
        tx.addSigner(changeAddr.pubKeyHash);

        // Attached the metadata for the minting transaction
        tx.addMetadata(721, {"map": [[nftTokenMPH.hex, {"map": [[nftTokenName,
                                        {
                                          "map": [["name", nftName],
                                                  ["image", imageUrl]
                                                 ]
                                        }
                                        ]]}
                                    ]]
                            }
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
            nftName: nftName,
            serialNum: serialNum,
            mph: nftTokenMPH.hex,
            cborTx: bytesToHex(txSigned.toCbor())
        }
        console.error("build-exchange-tx: return Obj", returnObj);
        process.stdout.write(JSON.stringify(returnObj));

    } catch (err) {
        const timestamp = new Date().toISOString();
        const returnObj = {
            status: canPay ? 500 : 501,
            date: timestamp,
            error: err
        }
        console.error("build-exchange-tx: return Obj", returnObj);
        process.stdout.write(JSON.stringify(returnObj));
    }
}

main();


  