import { promises as fs } from 'fs';
export { getNetworkParams };

async function getNetworkParams(network) {
    if (!['preview', 'preprod', 'mainnet'].includes(network)) {
        const err = `getNetworkParams: network not set or invalid: ${network}`
        console.error(err);
        throw new Error(err)
    }

    const networkParamsFile = getParamsFile(`./config/${network}.json`)
    const networkParams = await fs.readFile(networkParamsFile, 'utf8');
    return networkParams.toString();
}

