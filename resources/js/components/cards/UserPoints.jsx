
import { Button, Typography, Tooltip, Grid, IconButton, Stack, Box, Paper, Divider, Icon, CardContent, Card, CardActions} from "@mui/material"
import routes from "../../helpers/routes.helper"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { usePage } from "@inertiajs/inertia-react"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../store/slices/ToasterSlice"
import { AccountBalanceWallet, AddCard, Cached, DownloadForOffline, DownloadForOfflineOutlined, SwapVerticalCircle, SwapVerticalCircleOutlined } from "@mui/icons-material"
import FormDialog from "../common/FormDialog"
import Input from "../forms/Input"

const UserPoints = () => {

    const { errors, auth, translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        points: 0,
        wallet_id: '',
        submitUrl: '',
        method: null,
        processing: false,
        type: '',
    })

    const handleOnFeed = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.feed_points,
            submitUrl: routes["mypage.points.feed"],
            method: 'post',
            action: 'feed'
        }))
    }

    const handleExchange = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.exchange_points,
            submitUrl: routes["mypage.points.exchange"],
            method: 'post',
            action: 'exchange'
        }))
    }

    const dialogForm = () => {

        return (
            <Box mt={1}>
                <Input
                    label={translatables.texts.points}
                    type="number"
                    name="points"
                    value={dialog.points}
                    onChange={e => setDialog(dialog => ({ ...dialog, points: e.target.value }))}
                />
                {
                    dialog.action == 'feed' &&
                    <Input
                        label="Wallet ID"
                        name="wallet_id"
                        value={dialog.wallet_id}
                        onChange={e => setDialog(dialog => ({ ...dialog, wallet_id: e.target.value }))}
                        sx={{ mt: 2 }}
                    />
                }
            </Box>
        )
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = e => {
        e.preventDefault()

        Inertia.visit(dialog.submitUrl, {
            method: dialog.method,
            data: {
                points: dialog.points
            }
        })
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
                handleSubmit={handleOnDialogSubmit}
                children={dialogForm()}
                disableSubmit={
                    dialog.action == 'feed'
                    ? (dialog.points <= 0 || dialog.points.length <= 0) && dialog.wallet_id.length <= 0
                    : (dialog.points <= 0 || dialog.points.length <= 0)
                }
            />
        </>
    );
}

export default UserPoints
