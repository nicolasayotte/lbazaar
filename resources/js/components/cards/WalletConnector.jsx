
import { Button, Typography, Tooltip, Grid, IconButton, Stack, Box, Paper, Divider, Icon, CardContent, Card, CardActions} from "@mui/material"
import routes from "../../helpers/routes.helper"
import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { usePage } from "@inertiajs/inertia-react"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../store/slices/ToasterSlice"
import { AccountBalanceWallet, AddCard, Cached, DownloadForOffline, DownloadForOfflineOutlined, SwapVerticalCircle, SwapVerticalCircleOutlined } from "@mui/icons-material"
import FormDialog from "../common/FormDialog"
import Input from "../forms/Input"
import SvgIcon from '@mui/material/SvgIcon';
import EternlLogo from '../../../img/eternl-logo.jpg';
import FlintLogo from '../../../img/flint-logo.svg';
import NamiLogo from '../../../img/nami-logo.svg';
import axios from "axios";

const WalletConnector = () => {

    const { errors, auth, translatables } = usePage().props

    const [walletAPI, setWalletAPI] = useState(undefined);
    const [walletIsEnabled, setWalletIsEnabled] = useState(false);
    const [whichWalletSelected, setWhichWalletSelected] = 
                                                useState({
                                                    name : '', 
                                                    src : '',
                                                    w : 0,
                                                    h :0} | undefined);
    const [walletBalance, setWalletBalance] = useState(undefined);
    

    useEffect(() => {
        const checkWallet = async () => {
            if (await checkIfWalletFound()) {
                setWalletIsEnabled(await enableWallet());
            }
            //setWalletIsEnabled(await checkIfWalletFound());
        }
        checkWallet();
    }, [whichWalletSelected]);

    //useEffect(() => {
    //const enableSelectedWallet = async () => {
    //        if (walletIsEnabled) {
    //            await enableWallet();
    //        }
    //    }
    //    enableSelectedWallet();
    //}, [walletIsEnabled]);

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
                    //const balance = await walletAPI.getBalance();
                    //console.log("balance: ", balance);
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
      
    const WalletIconStatus = () => {
        const resetWalletSelect = () => {
            setWhichWalletSelected(undefined);
            setWalletIsEnabled(false);
            setWalletAPI(undefined);
        };
      
        return (
            <IconButton
                aria-label="change wallet"
                color="primary"
                onClick={resetWalletSelect}>
                <img src={whichWalletSelected.src} alt={whichWalletSelected.name} width={whichWalletSelected.w} height={whichWalletSelected.h}/>
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
                setWalletAPI(walletAPI);
                return true;
            } else if (walletChoice === "flint") {
                const walletAPI = await window.cardano.flint.enable();
                setWalletAPI(walletAPI);
                return true;
            } else if (walletChoice === "nami") {
                const walletAPI = await window.cardano.nami.enable();
                setWalletAPI(walletAPI);
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
     
        //const response = Inertia.visit(routes["wallet.info"], {
        //    method: 'post',
        //    data: {
        //        changeAddr: changeAddress
        //    }
        //});

        await axios.post('/api/wallet/info', {
            changeAddr: hexChangeAddr
        })
        .then(async response => {
            console.log("getWalletInfo: response", response);
            await setWalletBalance(Number(response.data[0]) / 1000000);   
        })
        .catch(error => {
            throw console.error("getWalletInfo: ", error);
        });   
    }

    return (
        <>
            {walletIsEnabled && <Card>
                <CardContent>  
                    <Stack direction="column" alignItems="left" spacing={1}>
                        <Box display="flex" alignItems="center">
                            <WalletIconStatus/>
                            <Typography variant="h5" color="BlackText">
                            Connected   
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" paddingLeft={0.5}>
                                {walletBalance && 
                                <Typography> Wallet Balance &nbsp;&nbsp;₳&nbsp;{walletBalance.toLocaleString()} 
                                </Typography>}
                        </Box>
                    </Stack>
                </CardContent>
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