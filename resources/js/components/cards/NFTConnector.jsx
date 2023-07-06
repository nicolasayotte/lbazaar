
import { Button, Typography, Tooltip, Grid, IconButton, Stack, Box, Paper, Divider, Icon, CardContent, Card, CardActions} from "@mui/material"
import routes from "../../helpers/routes.helper"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { usePage } from "@inertiajs/inertia-react"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../store/slices/ToasterSlice"
import { AccountBalanceWallet, AddCard, Cached, DoneOutline, DownloadForOffline, DownloadForOfflineOutlined, SwapVerticalCircle, SwapVerticalCircleOutlined } from "@mui/icons-material"
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import FormDialog from "../common/FormDialog"
import Input from "../forms/Input"
import SvgIcon from '@mui/material/SvgIcon';
import EternlLogo from '../../../img/eternl-logo.jpg';
import FlintLogo from '../../../img/flint-logo.svg';
import NamiLogo from '../../../img/nami-logo.svg';
import axios from "axios";
import verifySignature from "@cardano-foundation/cardano-verify-datasignature";


const NFTConnector = ({walletAdr, walletAPI, onWalletAPI}) => {

    const { errors, auth, translatables } = usePage().props

    //const [walletAPI, setWalletAPI] = useState(undefined);
    const [walletIsEnabled, setWalletIsEnabled] = useState(false);
    const [whichWalletSelected, setWhichWalletSelected] = 
                                                useState({
                                                    name : '', 
                                                    src : '',
                                                    w : 0,
                                                    h :0} | undefined);
    const [walletBalance, setWalletBalance] = useState(undefined);
    const [nftVerify, setNFTVerify] = useState(false);



    const [walletAddr, setwalletAddr] = useState(undefined);
    const [walletStakeKeyDisplay, setwalletStakeKeyDisplay] = useState(undefined);
    const [walletStakeAddrBech32, setWalletStakeAddrBech32] = useState(undefined);
    

    useEffect(() => {
        const checkWallet = async () => {
            if (await checkIfWalletFound()) {
                setWalletIsEnabled(await enableWallet());
            }
        }
        checkWallet();
    }, [whichWalletSelected]);

    useEffect(() => {
        const getBalance = async () => {
                if (walletIsEnabled && walletAPI) {
                    const balance = await walletAPI.getBalance();
                    console.log("balance: ", balance);
                }
            }
            getBalance();
    }, [walletIsEnabled]);

    useEffect(() => {
        const walletInfo = async () => {
                if (walletIsEnabled && walletAPI) {
                    console.log("useEffect: walletAPI", walletAPI);
                    const hexChangeAddr = await walletAPI.getChangeAddress();
                    console.log("useEffect: hexChangeAddr ", hexChangeAddr);
                    getWalletInfo(hexChangeAddr);
                }
            }
            walletInfo();
    }, [walletIsEnabled]);


    const WalletIconButton = ({ name, src, w, h }) => {
        const handleWalletSelect = () => {
            console.log("name: ", name);
            setWhichWalletSelected({name, src, w, h});
        };
      
        return (
            
            <IconButton
                aria-label={name}
                color="primary"
                onClick={handleWalletSelect}>
                <img src={src} alt={name} width={w} height={h}/>
            </IconButton>
        );
      };

    const checkIfWalletFound = async () => {

        let walletFound = false;
        console.log("whichWalletSelected: ", whichWalletSelected);
        if (whichWalletSelected) {
            const walletChoice = whichWalletSelected.name;
            if (walletChoice === "eternl") {
                walletFound = !!window?.cardano?.eternl;
            } else if (walletChoice === "flint") {
                walletFound = !!window?.cardano?.flint;
            } else if (walletChoice === "nami") {
                walletFound = !!window?.cardano?.nami;
            }
        }
        console.log("walletFound: ", walletFound);
        return walletFound;
    }

    const enableWallet = async () => {

        try {
            const walletChoice = whichWalletSelected.name;
            if (walletChoice === "eternl") {
                const walletAPI = await window.cardano.eternl.enable();
                onWalletAPI(walletAPI);
                console.log("enableWallet: walletAPI: ", walletAPI);
                return true;
            } else if (walletChoice === "flint") {
                const walletAPI = await window.cardano.flint.enable();
                onWalletAPI(walletAPI);
                return true;
            } else if (walletChoice === "nami") {
                const walletAPI = await window.cardano.nami.enable();
                onWalletAPI(walletAPI);
                return true;
            }
            return false;
            
            } catch (err) {
                alert("Please make sure your wallet dapp connector is turned on");
                console.error('enableWallet error', err);
                setWhichWalletSelected(undefined);
                return false;
            }
    }

    const getWalletInfo = async (hexChangeAddr) => {
     
        await axios.post('/wallet/info', {
            changeAddr: hexChangeAddr
        })
        .then(async response => {
            const respObj = await JSON.parse(response.data);
            console.log("getWalletInfo: response", respObj);
            setWalletBalance(Number(respObj.accountAmt) / 1000000);
            setwalletStakeAddr(respObj.stakeKeyAddr);
            setWalletStakeAddrBech32(respObj.stakeAddrBech32);
            const stakeKeyHash =respObj.stakeKeyHash;
            const displayStakeKey = stakeKeyHash.substring(0,6)
                            + "..." + stakeKeyHash.substring(stakeKeyHash.length - 6, stakeKeyHash.length);
            setwalletStakeKeyDisplay(displayStakeKey);
            //const stakeKeyHashVerified = auth.user.user_wallet.stake_key_hash;
            console.log("respObj.verified: ", respObj.verified);
            console.log("stakeKeyHash: ", stakeKeyHash);
            if (respObj.verified) {
                //setWalletVerify(true);
                onStakeKeyHash([displayStakeKey]);
            }
        })
        .catch(error => {
            throw console.error("getWalletInfo: ", error);
        });   
    }

    const handleNFTValidation = async () => {
        if (await handleNFTCheck()) {
            await handleNFTVerify();
        }
        
    }

    const handleNFTCheck = async () => {

        try {
            // get the UTXOs from wallet,
            const cborUtxos = await walletAPI.getUtxos();

            await axios.post('/nft/check', {
                nftName: nft.name,
                utxos: cborUtxos
            })
            .then(async response => {
                const respObj = await JSON.parse(response.data);
                console.log("handleNFTCheck: response", respObj);
                if (respObj.status == 200) {
                    setwalletAddr(respObj.addr);
                    return true;
                } else {
                    setNFTCheck(false);
                    alert("NFT Check Not Successful");
                    return false;
                }
            })
            .catch(error => {
                throw console.error("handleNFTCheck: ", error);
                
            }); 
        } catch (error) {
            console.error(error);
            alert('No NFT found in user wallet');
            return false;
        }
    }

    const handleNFTVerify = async () => {
    
        let message = 'NFT Verification ' + Date().toString();
        let hexMessage = '';

        for (var i = 0, l = message.length; i < l; i++) {
            hexMessage += message.charCodeAt(i).toString(16);
        }

        try {
            
            //console.log("walletStakeKey: ", walletStakeAddr);
            console.log("hexMessage: ", hexMessage);
            const { signature, key } = await walletAPI.signData(walletAddr, hexMessage);
            console.log(signature, key);
            
            //console.log("(signature, key)");
            //console.log(verifySignature(signature, key)); // true
            //console.log("(signature, key, message)");
            //console.log(verifySignature(signature, key, message)); // true
            //console.log("(signature, key, message, address)");
            //console.log(verifySignature(signature, key, message, walletStakeAddrBech32)); // true
            
            await axios.post('/nft/verify', {
                signature: signature,
                stake_key: key,
                message: message,
                wallet_addr: walletAddr
            })
            .then(async response => {
                const respObj = await JSON.parse(response.data);
                console.log("handleNFTVerify: response", respObj);
                if (respObj.status == 200) {
                    setNFTVerify(true);
                } else {
                    setNFTVerify(false);
                    alert("NFT Verify Not Successful");
                }
            })
            .catch(error => {
                throw console.error("handleNFTVerify: ", error);
            }); 
        } catch (error) {
            console.warn(error);
            alert('NFT not verified')
        }
    }

    const handleWalletSwitch = () => {
        setWhichWalletSelected(undefined);
        setWalletIsEnabled(false);
        onWalletAPI(undefined);
        setWalletVerify(false);
        setwalletStakeAddr(undefined);
        setwalletStakeKeyDisplay(undefined);
        setWalletStakeAddrBech32(undefined);
        onStakeKeyHash(undefined);

    }

    return (
        <>
            {walletIsEnabled && <Card>
                <CardContent>  
                    <Stack direction="column" alignItems="left" spacing={1}>
                        <Box display="flex" alignItems="center">
                            <Icon>
                                <img src={whichWalletSelected.src} alt={whichWalletSelected.name} width={whichWalletSelected.w} height={whichWalletSelected.h}/> 
                            </Icon>
                            <Typography variant="h5" color="BlackText">
                            &nbsp;Connected   
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" paddingLeft={0.5}>
                                {walletBalance && 
                                <Typography> 
                                    Wallet Balance &nbsp;&nbsp;₳&nbsp;{walletBalance.toLocaleString()} 
                                    <br></br>Wallet ID &nbsp;{walletStakeKeyDisplay}
                                </Typography>
                                }
                        </Box>
                    </Stack>
                </CardContent>
                <CardActions disableSpacing>
                        {!nftVerify && <Tooltip title={translatables.texts.wallet_verify} sx={{ ml: 'auto' }}>
                            <IconButton
                                color="primary"
                                onClick={handleNFTValidation}
                                children={<TaskAltIcon fontSize="inherit" color="disabled"/>}/>
                            </Tooltip>}
                        {nftVerify && <Tooltip title={translatables.texts.wallet_verify} sx={{ ml: 'auto' }}>
                            <IconButton
                                color="primary"
                                onClick={handleNFTValidation}
                                children={<TaskAltIcon fontSize="inherit"/>}/>
                            </Tooltip>}
                    <Tooltip title={translatables.texts.wallet_switch}>
                        <IconButton
                            color="success"
                            onClick={handleWalletSwitch}
                            children={<ChangeCircleIcon fontSize="inherit" />}
                        />
                    </Tooltip>
                </CardActions>
                </Card>
            }
            {!walletIsEnabled && <Card>
                <CardContent>  
                    <Stack direction="row" alignItems="left" spacing={1}>
                        <Box display="flex" alignItems="flex-end">
                            <Typography variant="h5" children={translatables.texts.wallet_connect} color="BlackText" /> 
                        </Box>
                    </Stack>
                </CardContent>
                <Stack direction="column" alignItems="left" spacing={1} ml={1} mb={1}>
                        <Box display="flex" alignItems="center" ml={0.5}>
                            <WalletIconButton name="eternl" src={EternlLogo} w={25} h={25}/>
                            <Typography color="BlackText">Eternl</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" ml={0}>
                            <WalletIconButton name="flint" src={FlintLogo} w={30} h={30}/>
                            <Typography color="BlackText">Flint</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" ml={0} paddingLeft={0.3}>
                            <WalletIconButton name="nami" src={NamiLogo} w={25} h={25}/>
                            <Typography color="BlackText">Nami</Typography>
                        </Box>
                </Stack>
            </Card> 
            }
            
        </>
    );
}

export default WalletConnector