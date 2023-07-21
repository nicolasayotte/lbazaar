import { Address,
    bytesToHex,
    bytesToText,
    MintingPolicyHash,
    Tx,
    UTxO, 
    } from "@hyperionbt/helios";


export {
    getTokenNamesAddrs
}

/**
 * Get the list of tokens names that match the minting policy
 * hash provided
 * @param {MintingPolicyHash} tokenMph
 * @param {UTxO[]} utxos
 * @returns {tokenNames: string[], addresses : string[]} 
 */
const getTokenNamesAddrs = async (tokenMph, utxos) => {
    let tn = [];
    let addr = [];
    for (const utxo of utxos) {
        const mphs = utxo.value.assets.mintingPolicies;
        for (const mph of mphs) {
            if (mph.hex == tokenMph.hex) {
                console.error("mph.hex: ", mph.hex);
                console.error("tokenMph.hex: ", tokenMph.hex);
                const tokenNames = utxo.value.assets.getTokenNames(mph);
                for (const tokenName of tokenNames) {
                    tn.push(bytesToText(tokenName.bytes));
                    addr.push(utxo.origOutput.address.toBech32());
                }
            }
        }
    }
    return { tokenNames: tn, addresses: addr }
}