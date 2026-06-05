
import { Typography, Tooltip, IconButton, Stack, Box, Icon, CardContent, Card, CardActions, Button } from "@mui/material"
import { useDispatch } from "react-redux"
import { useEffect, useState, useRef, useCallback } from "react"
import { actions } from "../../store/slices/ToasterSlice"
import {BrowserView, MobileView} from 'react-device-detect'
import { usePage } from "@inertiajs/inertia-react"
import Checkbox from '@mui/material/Checkbox'
import ConfirmationDialog from "../../components/common/ConfirmationDialog"
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle'
import TaskAltIcon from '@mui/icons-material/TaskAlt'
import EternlLogo from '../../../img/eternl-logo.jpg'
import FlintLogo from '../../../img/flint-logo.svg'
import NamiLogo from '../../../img/nami-logo.svg'
import axios from "axios"

// Fallback icons for known wallets when wallet.icon is absent
const fallbackIcons = {
    eternl: EternlLogo,
    flint:  FlintLogo,
    nami:   NamiLogo,
}

/**
 * Enumerates installed CIP-30 wallets from window.cardano.
 * A valid CIP-30 wallet exposes both .enable (function) and .apiVersion (string).
 * Returns an array of { key, name, icon } objects.
 */
const getInstalledWallets = () => {
    const cardano = window?.cardano
    if (!cardano) return []
    return Object.keys(cardano)
        .filter(key => {
            const w = cardano[key]
            return w && typeof w === 'object'
                && typeof w.enable === 'function'
                && typeof w.apiVersion === 'string'
        })
        .map(key => {
            const w = cardano[key]
            return {
                key,
                name: w.name || key,
                icon: w.icon || fallbackIcons[key] || null,
            }
        })
}

const WalletConnector = ({onStakeKeyHash, walletAPI, onWalletAPI}) => {

    const dispatch = useDispatch()

    const { translatables, cardano_network_id: expectedNetworkId = 0 } = usePage().props

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
    // { key, name, icon } — key matches the window.cardano[key] entry
    const [whichWalletSelected, setWhichWalletSelected] = useState(undefined)
    const [walletBalance, setWalletBalance] = useState(undefined)
    const [walletVerify, setWalletVerify] = useState(false)
    const [changeAddr, setChangeAddr] = useState(undefined)
    const [changeAddrBech32, setChangeAddrBech32] = useState(undefined)
    const [walletStakeAddr, setwalletStakeAddr] = useState(undefined)
    const [walletStakeKeyDisplay, setwalletStakeKeyDisplay] = useState(undefined)
    const [walletStakeAddrBech32, setWalletStakeAddrBech32] = useState(undefined)
    const [hardwareWallet, setHardwareWallet] = useState(false)
    const heartbeatRef = useRef(null)
    const eventListenersRef = useRef({ accountChange: null, networkChange: null })
    const [walletDisconnected, setWalletDisconnected] = useState(false)

    // Auto-reconnect previously connected wallet on mount
    useEffect(() => {
        const saved = localStorage.getItem('lbazaar_wallet')
        if (saved && !whichWalletSelected) {
            const installed = getInstalledWallets()
            const match = installed.find(w => w.key === saved)
            if (match) {
                setWhichWalletSelected(match)
            }
        }
    }, [])

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
                    setChangeAddr(hexChangeAddr)
                    getWalletInfo(hexChangeAddr)
                }
            }
            walletInfo()
    }, [walletIsEnabled])

    const handleHeartbeatDisconnect = useCallback((errorKey) => {
        clearInterval(heartbeatRef.current)
        localStorage.removeItem('lbazaar_wallet')
        setWhichWalletSelected(undefined)
        setWalletIsEnabled(false)
        onWalletAPI(undefined)
        setWalletVerify(false)
        setwalletStakeAddr(undefined)
        setwalletStakeKeyDisplay(undefined)
        setWalletStakeAddrBech32(undefined)
        onStakeKeyHash(undefined)
        setWalletDisconnected(true)
        dispatch(actions.error({
            message: translatables?.wallet_error?.[errorKey] ?? 'Your wallet was disconnected. Please reconnect.'
        }))
    }, [dispatch, translatables, onWalletAPI, onStakeKeyHash])

    useEffect(() => {
        if (!walletAPI || !whichWalletSelected) {
            clearInterval(heartbeatRef.current)
            return
        }
        const walletKey = whichWalletSelected.key
        const runHeartbeat = async () => {
            try {
                if (!window?.cardano?.[walletKey]) {
                    handleHeartbeatDisconnect('disconnected')
                    return
                }
                const networkId = await walletAPI.getNetworkId()
                if (networkId !== expectedNetworkId) {
                    handleHeartbeatDisconnect('disconnected')
                }
            } catch (_) {
                handleHeartbeatDisconnect('disconnected')
            }
        }
        heartbeatRef.current = setInterval(runHeartbeat, 10_000)
        return () => clearInterval(heartbeatRef.current)
    }, [walletAPI, whichWalletSelected, expectedNetworkId, handleHeartbeatDisconnect])

    const cleanupEventListeners = useCallback((api) => {
        if (!api?.experimental?.off) return
        if (eventListenersRef.current.accountChange) {
            api.experimental.off('accountChange', eventListenersRef.current.accountChange)
            eventListenersRef.current.accountChange = null
        }
        if (eventListenersRef.current.networkChange) {
            api.experimental.off('networkChange', eventListenersRef.current.networkChange)
            eventListenersRef.current.networkChange = null
        }
    }, [])

    useEffect(() => {
        if (!walletAPI || !whichWalletSelected) return
        if (!walletAPI?.experimental?.on) return

        const handleAccountChange = async () => {
            try {
                const hexChangeAddr = await walletAPI.getChangeAddress()
                setChangeAddr(hexChangeAddr)
                await getWalletInfo(hexChangeAddr)
            } catch (_) {
                handleHeartbeatDisconnect('account_changed')
            }
        }

        const handleNetworkChange = (networkId) => {
            if (networkId !== expectedNetworkId) {
                handleHeartbeatDisconnect('network_changed')
            }
        }

        eventListenersRef.current.accountChange = handleAccountChange
        eventListenersRef.current.networkChange = handleNetworkChange
        walletAPI.experimental.on('accountChange', handleAccountChange)
        walletAPI.experimental.on('networkChange', handleNetworkChange)

        return () => cleanupEventListeners(walletAPI)
    }, [walletAPI, whichWalletSelected, expectedNetworkId, handleHeartbeatDisconnect, cleanupEventListeners])

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

    const WalletIconButton = ({ wallet }) => {

        const handleWalletSelect = () => {
            setWhichWalletSelected(wallet)
        }

        return (
            <IconButton
                aria-label={wallet.name}
                color="primary"
                onClick={handleWalletSelect}>
                {wallet.icon
                    ? <img src={wallet.icon} alt={wallet.name} width={25} height={25}/>
                    : <span style={{ fontSize: 14, fontWeight: 'bold' }}>{wallet.name.slice(0,1).toUpperCase()}</span>
                }
            </IconButton>
        )
      }

    const WalletIconButtonMobile = ({ wallet }) => {

        const handleWalletSelect = () => {
            setWhichWalletSelected(wallet)
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
                    aria-label={wallet.name}
                    color="primary"
                    onClick={handleWalletSelect}>
                    {wallet.icon
                        ? <img src={wallet.icon} alt={wallet.name} width={25} height={25}/>
                        : <span style={{ fontSize: 14, fontWeight: 'bold' }}>{wallet.name.slice(0,1).toUpperCase()}</span>
                    }
                </IconButton>
            )
        } else
        return(
            <IconButton
                    aria-label={wallet.name}
                    color="primary"
                    onClick={redirectMobile}>
                    {wallet.icon
                        ? <img src={wallet.icon} alt={wallet.name} width={25} height={25}/>
                        : <span style={{ fontSize: 14, fontWeight: 'bold' }}>{wallet.name.slice(0,1).toUpperCase()}</span>
                    }
            </IconButton>
        )
      }

    const checkIfWalletFound = async () => {

        if (!whichWalletSelected) return false

        const walletFound = !!window?.cardano?.[whichWalletSelected.key]

        if (!walletFound) {
            dispatch(actions.error({
                message: translatables.wallet_error.not_found
            }))
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

        const checkNetwork = async (enabledAPI) => {
            const networkId = await enabledAPI.getNetworkId()
            if (networkId !== expectedNetworkId) {
                const networkName = expectedNetworkId === 1 ? 'Mainnet' : 'Testnet/Preprod'
                dispatch(actions.error({
                    message: translatables?.wallet_error?.wrong_network
                        ?? `Wrong network. Please switch your wallet to Cardano ${networkName}.`
                }))
                setWhichWalletSelected(undefined)
                return false
            }
            return true
        }

        try {
            setWalletDisconnected(false)
            const walletKey = whichWalletSelected.key
            const api = await window.cardano[walletKey].enable()
            if (!await checkNetwork(api)) return false
            localStorage.setItem('lbazaar_wallet', walletKey)
            onWalletAPI(api)
            return true

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
            setChangeAddrBech32(respObj.changeAddrBech32)
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
        
        if (!hardwareWallet) {

            try {
                const { signature, key } = await walletAPI.signData(walletStakeAddr, hexMessage)
                
                await axios.post('/wallet/verify', {
                    signature: signature,
                    stake_key: key,
                    addr: changeAddrBech32,
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
            }
        } else {

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
                            addr: changeAddrBech32,
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
        cleanupEventListeners(walletAPI)
        clearInterval(heartbeatRef.current)
        localStorage.removeItem('lbazaar_wallet')
        setWalletDisconnected(false)
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
                                {whichWalletSelected.icon
                                    ? <img src={whichWalletSelected.icon} alt={whichWalletSelected.name} width={25} height={25}/>
                                    : <span style={{ fontSize: 14, fontWeight: 'bold' }}>{whichWalletSelected.name.slice(0,1).toUpperCase()}</span>
                                }
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
                        {whichWalletSelected.key === "eternl" &&
                            <Box textAlign="center" display="flex" justifyContent="left" alignItems="center">
                                <Checkbox
                                    name="hwWallet"
                                    checked={hardwareWallet == 1}
                                    onChange={e => setHardwareWallet(e.target.checked)}
                                />
                                <Typography>{translatables.texts.wallet_hardware}</Typography>
                            </Box>
                        }
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
            {walletDisconnected && !walletIsEnabled && (
                <Box sx={{ p: 1.5, mb: 1, border: '1px solid', borderColor: 'warning.main', borderRadius: 1, backgroundColor: 'warning.light', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="warning.dark">
                        {translatables?.texts?.wallet_reconnect_prompt ?? 'Wallet disconnected. Please reconnect your wallet to continue.'}
                    </Typography>
                    <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={handleWalletSwitch}
                        sx={{ ml: 1, whiteSpace: 'nowrap' }}
                    >
                        {translatables?.texts?.wallet_reconnect_button ?? 'Reconnect'}
                    </Button>
                </Box>
            )}
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
                    {(() => {
                        const installed = getInstalledWallets()
                        if (installed.length === 0) {
                            return (
                                <Box ml={0.5} mb={1}>
                                    <Typography color="text.secondary">
                                        {translatables?.wallet_error?.not_found ?? 'No Cardano wallet found. Please install a CIP-30 compatible wallet.'}
                                    </Typography>
                                </Box>
                            )
                        }
                        return installed.map(wallet => (
                            <Box key={wallet.key} display="flex" alignItems="center" ml={0.5}>
                                <WalletIconButton wallet={wallet}/>
                                <Typography color="BlackText">{wallet.name}</Typography>
                            </Box>
                        ))
                    })()}
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
                        {(() => {
                            const installed = getInstalledWallets()
                            if (installed.length === 0) {
                                return (
                                    <Box ml={0.5} mb={1}>
                                        <Typography color="text.secondary">
                                            {translatables?.wallet_error?.not_found ?? 'No Cardano wallet found. Please install a CIP-30 compatible wallet.'}
                                        </Typography>
                                    </Box>
                                )
                            }
                            return installed.map(wallet => (
                                <Box key={wallet.key} display="flex" alignItems="center" ml={0}>
                                    <WalletIconButtonMobile wallet={wallet}/>
                                    <Typography color="BlackText">{wallet.name}</Typography>
                                </Box>
                            ))
                        })()}
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