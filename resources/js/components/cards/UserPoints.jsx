
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
import axios from "axios"

const UserPoints = ({walletStakeKeyHash, walletAPI}) => {

    useEffect(() => {
        const checkStakeKey = async () => {
            console.log("UserPoints: walletStakeKeyHash: ", walletStakeKeyHash);
        }
        checkStakeKey();
    }, [walletStakeKeyHash]);

    useEffect(() => {
        const checkWalletAPI = async () => {
            console.log("UserPoints: walletAPI: ", walletAPI);
        }
        checkWalletAPI();
    }, [walletAPI]);

    
    const { errors, auth, translatables, ada_to_points, points_to_nft } = usePage().props

    //console.log("UserPoints: general_settings: ", usePage().props)
    //console.log("UserPoints: translatables: ", translatables)

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        points: 0,
        wallet_id: walletStakeKeyHash,
        submitUrl: '',
        method: null,
        processing: false,
        type: '',
    })

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
            points: points_to_nft,
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
                    //onChange={e => setDialog(dialog => ({ ...dialog, wallet_id: e.target.value }))}
                    sx={{ mt: 2 }}
                />
                <Input
                    label="Wallet ID"
                    name="wallet_id"
                    value={dialog.wallet_id}
                    //onChange={e => setDialog(dialog => ({ ...dialog, wallet_id: e.target.value }))}
                    sx={{ mt: 2 }}
                />
            </Box>
        )
    }

    const dialogFormExchange = () => {

        return (
            <Box mt={1}>
                <Input
                    label={translatables.texts.points}
                    //type="number"
                    name="points"
                    value={dialog.points}
                    //onChange={e => setDialog(dialog => ({ ...dialog, points: e.target.value }))}
                />
                <Input
                    label="Wallet ID"
                    name="wallet_id"
                    value={dialog.wallet_id}
                    //onChange={e => setDialog(dialog => ({ ...dialog, wallet_id: e.target.value }))}
                    sx={{ mt: 2 }}
                />
            </Box>
        )
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmitFeed = e => {
        e.preventDefault()

        Inertia.visit(dialog.submitUrl, {
            method: dialog.method,
            data: {
                points: dialog.points,
                wallet_id: dialog.wallet_id
            }
        })
    }

    const handleOnDialogSubmitExchange = async (e) => {
        e.preventDefault()

        //Inertia.visit(dialog.submitUrl, {
        //    method: dialog.method,
        //    data: {
        //        points: dialog.points,
        //        wallet_id: dialog.wallet_id
        //    }
        //})

        try {
            // get the UTXOs from wallet,
            const cborUtxos = await walletAPI.getUtxos();

            // Get the change address from the wallet
            const hexChangeAddr = await walletAPI.getChangeAddress();

            await axios.post('/wallet/build-exchange-tx', {
                changeAddr: hexChangeAddr,
                utxos: cborUtxos
            })
            .then(async response => {
                const exchangeTx = await JSON.parse(response.data);

                if (exchangeTx.status == 200) {

                    // Get user to sign the transaction
                    console.log("Get wallet signature");
                    var walletSig;
                    try {
                        walletSig = await walletAPI.signTx(exchangeTx.cborTx, true);
                    } catch (err) {
                        console.error(err);
                        return
                    }

                    console.log("Submit transaction...");
                    await axios.post('/wallet/submit-tx', {
                        cborSig: walletSig,
                        cborTx: exchangeTx.cborTx
                    })
                    .then(async response => {
                
                        const submitTx = await JSON.parse(response.data);
                        if (submitTx.status == 200) {
                            console.log("submitTx Success: ", submitTx.txId);
                        } else {
                            console.error("Exchange transaction could not be submitted");
                            alert ('Exchange transaction could not be submitted, please try again');
                        }
                    })
                    .catch(error => {
                        console.error("submit-tx: ", error);
                        alert ('Exchange transaction could not be submitted, please try again');
                    });

                } else {
                    console.error("Exchange transaction could not be submitted");
                    alert ('Exchange transaction could not be submitted, please try again');
                }
            })
            .catch(error => {
                console.error("submit-tx: ", error);
                alert ('Exchange transaction could not be submitted, please try again');
            });
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <>  
            <Card>
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
            </Card>
            <FormDialog
                {...dialog}
                handleClose={handleOnDialogClose}
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
    );
}

export default UserPoints
