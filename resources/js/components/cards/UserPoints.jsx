
import { Typography, Tooltip, IconButton, Stack, Box, CardContent, Card, CardActions} from "@mui/material"
import routes from "../../helpers/routes.helper"
import { useDispatch } from "react-redux"
import { useState } from "react"
import { usePage } from "@inertiajs/inertia-react"
import { actions } from "../../store/slices/ToasterSlice"
import { AccountBalanceWallet, DownloadForOffline, SwapVerticalCircle } from "@mui/icons-material"
import FormDialog from "../common/FormDialog"
import Input from "../forms/Input"
import Spinner from '../common/Spinner'
import axios from "axios"

const UserPoints = ({walletStakeKeyHash, walletAPI}) => {

    const dispatch = useDispatch()
    
    const { auth, translatables, ada_to_points, nfts, network } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        nfts: undefined,
        nftName: '',
        points: 0,
        wallet_id: walletStakeKeyHash,
        submitUrl: '',
        method: null,
        processing: false,
        type: '',
    })

    const [loading, setLoading] = useState(false)
    const [tx, setTx] = useState(false)

    const handleOnFeed = () => {
        setDialog(dialog => ({
            ...dialog,
            points: 0,
            open: true,
            title: translatables.texts.feed_points,
            submitUrl: routes["mypage.points.feed"],
            method: 'post',
            action: 'feed',
            wallet_id: walletStakeKeyHash,
        }))
    }

    const handleExchange = () => {
        setDialog(dialog => ({
            ...dialog,
            nfts: nfts,
            open: true,
            title: translatables.texts.exchange_points,
            submitUrl: routes["wallet.exchange"],
            method: 'post',
            action: 'exchange',
            wallet_id: walletStakeKeyHash
        }))
    }

    const dialogFormFeed = () => {

        return (
            <Box mt={1}>
                {loading && <Spinner />}
                <Input
                    label={translatables.texts.points}
                    type="number"
                    name="points"
                    value={dialog.points}
                    onChange={e => setDialog(dialog => ({ ...dialog, points: Math.abs(e.target.value) }))}
                />
                <Input
                    label="Ada Amount"
                    name="ada_amount"
                    value={dialog.points * Number(ada_to_points)}
                    sx={{ mt: 2 }}
                />
                <Input
                    label="Wallet ID"
                    name="wallet_id"
                    value={dialog.wallet_id}
                    sx={{ mt: 2 }}
                />
            </Box>
        )
    }

    const handleSelectChange = (event) => {
        const selectedValues = event.target.value.split(',')
        const points = selectedValues[0]
        const name = selectedValues[1]
        setDialog(dialog => ({ ...dialog,
                                nftName: name,
                                points: Math.abs(points)}))
      }

    const dialogFormExchange = () => {

        return (
            <Box mt={1}>
                {loading && <Spinner />}
                <Input
                    select
                    label={translatables.texts.nft}
                    InputLabelProps={{
                        shrink: true
                    }}
                    name="nft"
                    onChange={handleSelectChange}
                >
                    <option value="">{translatables.texts.nft_select}</option>
                    {nfts && nfts.map((item) => (
                    <option key={item.id} value={[item.points, item.name]}>
                        {item.name}
                    </option>
                    ))}
                </Input>
                <Input
                    label={translatables.texts.points}
                    name="points"
                    value={dialog.points}
                    sx={{ mt: 2 }}
                />
                <Input
                    label={translatables.texts.wallet_id}
                    name="wallet_id"
                    value={dialog.wallet_id}
                    sx={{ mt: 2 }}
                />
            </Box>
        )
    }

    const handleOnDialogCloseExchange = (e) => {
        
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogCloseFeed = (e) => {

        setDialog(dialog => ({
            ...dialog,
            open: false,
            points: 0
        }))
    }

    const handleOnDialogSubmitFeed = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // get the UTXOs from wallet,
            const cborUtxos = await walletAPI.getUtxos()

            // Get the change address from the wallet
            const hexChangeAddr = await walletAPI.getChangeAddress()

            await axios.post('/wallet/build-feed-tx', {
                changeAddr: hexChangeAddr,
                utxos: cborUtxos,
                points: dialog.points
            })
            .then(async response => {
                const feedTx = await JSON.parse(response.data)

                if (feedTx.status == 200) {

                    // Get user to sign the transaction
                    var walletSig
                        try {
                            walletSig = await walletAPI.signTx(feedTx.cborTx, true)
                        } catch (err) {
                            console.error(err)
                            dispatch(actions.error({
                                message: translatables.tx.error.message
                            }))
                            return
                        }

                    console.log("Submit transaction...")
                    await axios.post('/wallet/submit-feed-tx', {
                        cborSig: walletSig,
                        cborTx: feedTx.cborTx
                    })
                    .then(async response => {
                
                        const submitTx = await JSON.parse(response.data)
                        if (submitTx.status == 200) {
                            console.log("submitFeedTx Success: ", submitTx.txId)
                            setTx(submitTx.txId)
                        } else {
                            console.error("Transaction could not be submitted")
                            dispatch(actions.error({
                                message: translatables.tx.error.message
                            }))
                        }
                    })
                    .catch(error => {
                        console.error("submit-tx: ", error)
                        dispatch(actions.error({
                            message: translatables.tx.error.message
                        }))
                    })

                } else if (feedTx.status == 501) {
                    console.error("Insufficient funds in wallet")
                    dispatch(actions.error({
                        message: translatables.wallet_error.insufficient_funds
                    }))
                } else {
                    console.error("Transaction could not be submitted")
                    dispatch(actions.error({
                        message: translatables.tx.error.message
                    }))
                }
            })
            .catch(error => {
                console.error("submit-tx: ", error)
                dispatch(actions.error({
                    message: translatables.tx.error.message
                }))
            })
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
        handleOnDialogCloseFeed(e)
    }

    const handleOnDialogSubmitExchange = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            // get the UTXOs from wallet,
            const cborUtxos = await walletAPI.getUtxos()

            // Get the change address from the wallet
            const hexChangeAddr = await walletAPI.getChangeAddress()

            await axios.post('/wallet/build-exchange-tx', {
                changeAddr: hexChangeAddr,
                nft: dialog.nftName,
                utxos: cborUtxos,
            })
            .then(async response => {
                const exchangeTx = await JSON.parse(response.data)

                if (exchangeTx.status == 200) {

                    // Get user to sign the transaction
                    var walletSig
                    try {
                        walletSig = await walletAPI.signTx(exchangeTx.cborTx, true)
                    } catch (err) {
                        console.error(err)
                        dispatch(actions.error({
                            message: translatables.tx.error.message
                        }))
                        return
                    }

                    console.log("Submit transaction...")
                    await axios.post('/wallet/submit-exchange-tx', {
                        nft: dialog.nftName,
                        serialNum : exchangeTx.serialNum,
                        mph: exchangeTx.mph,
                        cborSig: walletSig,
                        cborTx: exchangeTx.cborTx,
                       
                    })
                    .then(async response => {
                
                        const submitTx = await JSON.parse(response.data)
                        if (submitTx.status == 200) {
                            console.log("submitExchangeTx Success: ", submitTx.txId)
                            setTx(submitTx.txId)
                        } else {
                            console.error("Exchange transaction could not be submitted")
                            dispatch(actions.error({
                                message: translatables.tx.error.message
                            }))
                        }
                    })
                    .catch(error => {
                        console.error("submit-tx: ", error)
                        dispatch(actions.error({
                            message: translatables.tx.error.message
                        }))
                    })
                } else if (exchangeTx.status == 501) {
                    console.error("Insufficient funds in wallet")
                    dispatch(actions.error({
                        message: translatables.wallet_error.insufficient_funds
                    }))
                } else {
                    console.error("Exchange transaction could not be submitted")
                    dispatch(actions.error({
                        message: translatables.tx.error.message
                    }))
                }
            })
            .catch(error => {
                console.error("submit-tx: ", error)
                dispatch(actions.error({
                    message: translatables.tx.error.message
                }))
            })
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
        handleOnDialogCloseExchange(e)
    }

    return (
        <>  
            {!tx && <Card>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <AccountBalanceWallet />
                        <Box display="flex" alignItems="flex-end">
                            <Typography variant="h5" children={auth.user.user_wallet.points.toFixed(2)} mr={0.5} />
                            <Typography variant="caption" children={translatables.texts.points.toLowerCase()} color="GrayText" />
                        </Box>
                    </Stack>
                </CardContent>
                <CardActions disableSpacing>
                    <Tooltip title={translatables.texts.feed_points} sx={{ ml: 'auto' }}>
                        <IconButton
                            color="primary"
                            onClick={handleOnFeed}
                            children={<DownloadForOffline fontSize="inherit" />}
                        />
                    </Tooltip>
                    <Tooltip title={translatables.texts.exchange_points}>
                        <IconButton
                            color="success"
                            onClick={handleExchange}
                            children={<SwapVerticalCircle fontSize="inherit" />}
                        />
                    </Tooltip>
                </CardActions>
            </Card>}
            {tx && <Card>
                <CardContent>
                    <Typography variant="h5" children={translatables.tx.success.status}/>
                    <Typography fontSize={12} ml={0.5}>{translatables.tx.success.message}</Typography>
                    <Typography fontSize={7} ml={0.5}><a href={"https://" + network + ".cexplorer.io/tx/" + tx} target="_blank" rel="noopener noreferrer" >{tx}</a></Typography>
                </CardContent>
            </Card>}
            <FormDialog
                {...dialog}
                handleClose={dialog.action == 'feed'
                    ? handleOnDialogCloseFeed
                    : handleOnDialogCloseExchange}
                handleSubmit={
                    dialog.action == 'feed'
                    ? handleOnDialogSubmitFeed
                    : handleOnDialogSubmitExchange}
                children={
                    dialog.action == 'feed'
                    ? dialogFormFeed()
                    : dialogFormExchange()}
                disableSubmit={
                    dialog.action == 'feed'
                    ? (dialog.points <= 0 || dialog.points.length <= 0 || dialog.wallet_id.length <= 0)
                    : (dialog.points <= 0 || dialog.points.length <= 0 || dialog.wallet_id.length <= 0 || dialog.points > auth.user.user_wallet.points)
                }
            />
        </>
    )
}

export default UserPoints
