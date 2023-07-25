import { promises as fs } from 'fs';

import {
    Address, 
    hexToBytes, 
    Program, 
    UTxO 
} from "@hyperionbt/helios";

import { getTokenNamesAddrs } from "../common/utils.mjs"

/**
 * Main calling function via the command line 
 * Usage: node nft-check.js nftName skateKeyHash [cborUtxo1,cborUtxo2,...]
 * @params {string, string, string[]} nftName stakeKeyHash
 * @output {string} cborUtxos
 */
const main = async () => {

    try {
        const args = process.argv;
        console.error("nft-check: args: ", args);
        
        // Set the Helios compiler optimizer flag
        const optimize = (process.env.OPTIMIZE === 'true');
        const ownerPkh = process.env.OWNER_PKH;
        const nftName = args[2];
        const stakeKeyHash = args[3];
        const cborUtxos = args[4].split(',');
  
        // Get UTXOs from wallet
        const walletUtxos = cborUtxos.map(u => UTxO.fromCbor(hexToBytes(u)));
      
        const nftMintingPolicyFile = await fs.readFile('./contracts/nft-minting-policy.hl', 'utf8');
        const nftMintingPolicyScript = nftMintingPolicyFile.toString();
        const nftMintingProgram  = Program.new(nftMintingPolicyScript);
        nftMintingProgram.parameters = {["OWNER_PKH"] : ownerPkh};
        nftMintingProgram.parameters = {["VERSION"] : "1.0"};
        const compiledNftMintingProgram = nftMintingProgram.compile(optimize);
        const nftTokenMPH = compiledNftMintingProgram.mintingPolicyHash;

        const { tokenNames, addresses } = await getTokenNamesAddrs(nftTokenMPH, walletUtxos);
        console.error("tokenNames: ", tokenNames);
        if (!tokenNames) {
            throw console.error("No NFT tokens found in wallet");
        }
        if (tokenNames.length == 0) {
            throw console.error("No NFT tokens found in wallet");
        }
        var serialNum;
        var addrBech32;
        let i = 0;
        for (const tn of tokenNames) {
            if (tn.includes(nftName)) {
                serialNum = tn.split('|')[1];
                addrBech32 = addresses[i];
                break;
            }
            i++;
        }

        const addr = Address.fromBech32(addrBech32);
        if (stakeKeyHash !== addr.stakingHash.hex) {
            throw console.error("Staking Key Does Not Match Verified Wallet");
        }
        
        const returnObj = {
            status: 200,
            mph: nftTokenMPH.hex,
            nftName: nftName,
            serialNum: serialNum,
            addrHex: addr.toHex()
        }
        console.error("nft-check: returnObj: ", returnObj);
        process.stdout.write(JSON.stringify(returnObj));

    } catch (err) {
        const timestamp = new Date().toISOString();
        const returnObj = {
            status: 500,
            date: timestamp,
            error: err
        }
        console.error("nft-check: returnObj: ", returnObj);
        process.stdout.write(JSON.stringify(returnObj));
    }
}

main();


  