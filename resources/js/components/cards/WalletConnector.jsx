
import { Typography, Tooltip, IconButton, Stack, Box, Icon, CardContent, Card, CardActions} from "@mui/material"
import { useDispatch } from "react-redux"
import { useEffect, useState } from "react"
import { actions } from "../../store/slices/ToasterSlice"
import {BrowserView, MobileView} from 'react-device-detect'
import { usePage } from "@inertiajs/inertia-react"
import ConfirmationDialog from "../../components/common/ConfirmationDialog"
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import EternlLogo from '../../../img/eternl-logo.jpg'
import FlintLogo from '../../../img/flint-logo.svg'
import NamiLogo from '../../../img/nami-logo.svg'
import axios from "axios"

const WalletConnector = ({onStakeKeyHash, walletAPI, onWalletAPI}) => {

    const dispatch = useDispatch()

    const { translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        value: '',
        submitUrl: '',
        method: null,
    })

    const [loggedIn, setLoggedIn] = useState(false)
    const [walletIsEnabled, setWalletIsEnabled] = useState(false)
    const [whichWalletSelected, setWhichWalletSelected] = 
                                                useState({
                                                    name : '', 
                                                    src : '',
                                                    w : 0,
                                                    h :0} | undefined)
    const [walletBalance, setWalletBalance] = useState(undefined)
    const [walletVerify, setWalletVerify] = useState(false)
    const [walletStakeAddr, setwalletStakeAddr] = useState(undefined)
    const [walletStakeKeyDisplay, setwalletStakeKeyDisplay] = useState(undefined)
    const [walletStakeAddrBech32, setWalletStakeAddrBech32] = useState(undefined)
    
    useEffect(() => {
        const checkWallet = async () => {
            if (await checkIfWalletFound()) {
                if (await checkUserSignedIn()) {
                    setWalletIsEnabled(await enableWallet())
                } 
            }
        }
        checkWallet()
    }, [whichWalletSelected])

    useEffect(() => {
        const getBalance = async () => {
                if (walletIsEnabled && walletAPI) {
                    const balance = await walletAPI.getBalance()
                }
            }
            getBalance()
    }, [walletIsEnabled])

    useEffect(() => {
        const walletInfo = async () => {
                if (walletIsEnabled && walletAPI) {
                    const hexChangeAddr = await walletAPI.getChangeAddress()
                    getWalletInfo(hexChangeAddr)
                }
            }
            walletInfo()
    }, [walletIsEnabled])

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = e => {

        window.location.href = dialog.submitUrl
        handleOnDialogClose()
    }

    const WalletIconButton = ({ name, src, w, h }) => {
        
        const handleWalletSelect = () => {
           
            setWhichWalletSelected({name, src, w, h})
        }

        return (
            <IconButton
                aria-label={name}
                color="primary"
                onClick={handleWalletSelect}>
                <img src={src} alt={name} width={w} height={h}/>
            </IconButton>
        )
      }

    const WalletIconButtonMobile = ({ name, src, w, h }) => {
        
        const handleWalletSelect = () => {
           
            setWhichWalletSelected({name, src, w, h})
        }

        const redirectMobile = () => {

            setDialog(dialog => ({
                ...dialog,
                open: true,
                title: translatables.texts.mobile,
                text: translatables.confirm.mobile.view,
                submitUrl: 'https://flint-wallet.app.link/browse?dappUrl=' + window.location.href,
                method: 'get',
                action: 'mobile'
            }))
            
        }
   
        if (!!window?.cardano?.flint) {
            return (
                <IconButton
                    aria-label={name}
                    color="primary"
                    onClick={handleWalletSelect}>
                    <img src={src} alt={name} width={w} height={h}/>
                </IconButton>
            )
        } else 
        return(
            <IconButton
                    aria-label={name}
                    color="primary"
                    onClick={redirectMobile}>
                    <img src={src} alt={name} width={w} height={h}/>
            </IconButton>
        )
      }

    const checkIfWalletFound = async () => {

        let walletFound = false
        
        if (whichWalletSelected) {
            const walletChoice = whichWalletSelected.name
            if (walletChoice === "eternl") {
                walletFound = !!window?.cardano?.eternl
            } else if (walletChoice === "flint") {
                walletFound = !!window?.cardano?.flint
            } else if (walletChoice === "nami") {
                walletFound = !!window?.cardano?.nami
            } 

            if (!walletFound) {
                dispatch(actions.error({
                    message: translatables.wallet_error.not_found
                }))
            }
        }
        return walletFound
    }


    const checkUserSignedIn = async () => {

        try {
            await axios.get('/user-status')
                        .then(async response => {
                        
                            if (response.data.loggedIn) {
                                console.log("logged in")
                                setLoggedIn(response.data.loggedIn)
                            } else {
                                console.log("not logged in")
                                setLoggedIn(false)
                                dispatch(actions.error({
                                    message: translatables.wallet_error.no_signin
                                }))
                                throw console.error("user not signed in")
                            }
                        })
                        .catch(error => {
                            throw error
                        })
            return true
            
        } catch (err) {
            return false
        }
    }


    const enableWallet = async () => {

        try {
            const walletChoice = whichWalletSelected.name
            if (walletChoice === "eternl") {
                const walletAPI = await window.cardano.eternl.enable()
                onWalletAPI(walletAPI)
                return true
            } else if (walletChoice === "flint") {
                const walletAPI = await window.cardano.flint.enable()
                onWalletAPI(walletAPI)
                return true
            } else if (walletChoice === "nami") {
                const walletAPI = await window.cardano.nami.enable()
                onWalletAPI(walletAPI)
                return true
            } else {
                dispatch(actions.error({
                    message: translatables.wallet_error.not_connected
                }))
                return false
            }
            
        } catch (err) {
            
            dispatch(actions.error({
                message: translatables.wallet_error.not_connected
            }))
            setWhichWalletSelected(undefined)
            return false
        }
    }

    const getWalletInfo = async (hexChangeAddr) => {
     
        await axios.post('/wallet/info', {
            changeAddr: hexChangeAddr
        })
        .then(async response => {
            const respObj = await JSON.parse(response.data)
            setWalletBalance(Number(respObj.accountAmt) / 1000000)
            setwalletStakeAddr(respObj.stakeKeyAddr)
            setWalletStakeAddrBech32(respObj.stakeAddrBech32)
            
            const stakeKeyHash =respObj.stakeKeyHash
            const displayStakeKey = stakeKeyHash.substring(0,6)
                            + "..." + stakeKeyHash.substring(stakeKeyHash.length - 6, stakeKeyHash.length)
            setwalletStakeKeyDisplay(displayStakeKey)
            
            if (respObj.verified) {
                setWalletVerify(true)
                onStakeKeyHash([displayStakeKey])
            }
        })
        .catch(error => {
            dispatch(actions.error({
                message: translatables.wallet_error.verify
            }))
            throw console.error("getWalletInfo: ", error)
        })   
    }

    const handleWalletVerify = async () => {
    
        let message = translatables.texts.wallet_message
        let hexMessage = ''

        for (var i = 0, l = message.length; i < l; i++) {
            hexMessage += message.charCodeAt(i).toString(16)
        }

        try {
            const { signature, key } = await walletAPI.signData(walletStakeAddr, hexMessage)
            
            await axios.post('/wallet/verify', {
                signature: signature,
                stake_key: key,
                message: hexMessage,  
                stake_addr: walletStakeAddrBech32
            })
            .then(async response => {
                const respObj = await JSON.parse(response.data)
                
                if (respObj.status == 200) {

                    setWalletVerify(true)
                    onStakeKeyHash([walletStakeKeyDisplay])
                    dispatch(actions.success({
                        message: translatables.success.wallet.verify
                    }))
                } else {
                    setWalletVerify(false)
                    onStakeKeyHash(undefined)
                    dispatch(actions.error({
                        message: translatables.wallet_error.verify
                    }))
                }
            })
            .catch(error => {
                throw console.error("getWalletVerify: ", error)
            }) 
        } catch (error) {

            if (error.code == 3 || error.code == -3) {
                // User has declined to sign Data, exit gracefully
                dispatch(actions.error({
                    message: translatables.wallet_error.verify
                }))
                return
            }

            // Will try again, but by signing a tx (and not submitting it)
            try {
                const hexAddress = await walletAPI.getChangeAddress()
                
                // get the UTXOs from wallet,
                const cborUtxos = await walletAPI.getUtxos()
                
                await axios.post('/wallet/build-hw-tx', {
                    changeAddr: hexAddress,
                    utxos: cborUtxos
                })
                .then(async response => {
                    const respObj = await JSON.parse(response.data)
                    
                    if (respObj.status == 200) {

                        // Get user to sign the transaction
                        var walletSig
                        try {
                            walletSig = await walletAPI.signTx(respObj.cborTx, true)
                        } catch (err) {
                            console.error(err)
                            dispatch(actions.error({
                                message: translatables.wallet_error.verify
                            }))
                            return
                        }
                        await axios.post('/wallet/verify-hw', {
                            walletSig: walletSig,
                            cborTx: respObj.cborTx,
                            stakeAddr: walletStakeAddrBech32
                        })
                        .then(async response => {
                            const respObj = await JSON.parse(response.data)
                            if (respObj.status == 200) {
                                setWalletVerify(true)
                                onStakeKeyHash([walletStakeKeyDisplay])
                                dispatch(actions.success({
                                    message: translatables.success.wallet.verify
                                }))
                            } else {
                                setWalletVerify(false)
                                onStakeKeyHash(undefined)
                                dispatch(actions.error({
                                    message: translatables.wallet_error.verify
                                }))
                            }
                        })
                        .catch(error => {
                            throw console.error("getWalletVerify: ", error)
                        }) 

                    } else {
                        setWalletVerify(false)
                        onStakeKeyHash(undefined)
                        dispatch(actions.error({
                            message: translatables.wallet_error.verify
                        }))
                    }
                })
                .catch(error => {
                    throw console.error("handleWalletVerify: ", error)
                }) 

            } catch (error) {
                console.warn(error)
                dispatch(actions.error({
                    message: translatables.wallet_error.verify
                }))
            }
        }
    }

    const handleWalletSwitch = () => {
        setWhichWalletSelected(undefined)
        setWalletIsEnabled(false)
        onWalletAPI(undefined)
        setWalletVerify(false)
        setwalletStakeAddr(undefined)
        setwalletStakeKeyDisplay(undefined)
        setWalletStakeAddrBech32(undefined)
        onStakeKeyHash(undefined)
    }

    return (
        <>
            {walletIsEnabled && loggedIn && <Card>
                <CardContent>  
                    <Stack direction="column" alignItems="left" spacing={1}>
                        <Box display="flex" alignItems="center">
                            <Icon>
                                <img src={whichWalletSelected.src} alt={whichWalletSelected.name} width={whichWalletSelected.w} height={whichWalletSelected.h}/> 
                            </Icon>
                            <Typography variant="h5" color="BlackText">
                            &nbsp;{translatables.texts.wallet_connected}   
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" paddingLeft={0.5}>
                                {walletBalance && 
                                <Typography> 
                                    {translatables.texts.wallet_balance} &nbsp;&nbsp;₳&nbsp;{walletBalance.toLocaleString()} 
                                    <br></br>{translatables.texts.wallet_id} &nbsp;{walletStakeKeyDisplay}
                                </Typography>
                                }
                        </Box>
                    </Stack>
                </CardContent>
                <CardActions disableSpacing>
                        {!walletVerify && <Tooltip title={translatables.texts.wallet_verify} sx={{ ml: 'auto' }}>
                            <IconButton
                                color="primary"
                                onClick={handleWalletVerify}
                                children={<TaskAltIcon fontSize="inherit" color="disabled"/>}/>
                            </Tooltip>}
                        {walletVerify && <Tooltip title={translatables.texts.wallet_verify} sx={{ ml: 'auto' }}>
                            <IconButton
                                color="primary"
                                onClick={handleWalletVerify}
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
            <BrowserView>
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
                            <Typography color="BlackText">{translatables.wallets.eternl}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" ml={0}>
                            <WalletIconButton name="flint" src={FlintLogo} w={30} h={30}/>
                            <Typography color="BlackText">{translatables.wallets.flint}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" ml={0} paddingLeft={0.3}>
                            <WalletIconButton name="nami" src={NamiLogo} w={25} h={25}/>
                            <Typography color="BlackText">{translatables.wallets.nami}</Typography>
                        </Box>
                </Stack>
            </Card> 
            }
            </BrowserView>
            <MobileView>
                {!walletIsEnabled && <Card>
                    <CardContent>  
                        <Stack direction="row" alignItems="left" spacing={1}>
                            <Box display="flex" alignItems="flex-end">
                                <Typography variant="h5" children={translatables.texts.wallet_connect} color="BlackText" /> 
                            </Box>
                        </Stack>
                    </CardContent>
                    <Stack direction="column" alignItems="left" spacing={1} ml={1} mb={1}>
                            <Box display="flex" alignItems="center" ml={0}>
                                <WalletIconButtonMobile name="flint" src={FlintLogo} w={30} h={30}/>
                                <Typography color="BlackText">{translatables.wallets.flint}</Typography>
                            </Box>
                    </Stack>
                </Card>}
            </MobileView>
            <Box>
                <ConfirmationDialog
                        {...dialog}
                        handleClose={handleOnDialogClose}
                        handleConfirm={handleOnDialogSubmit}
                />
            </Box>
        </>
    )
}

export default WalletConnector