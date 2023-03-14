
import {Card, CardContent, Button, Typography, Tooltip, Grid, IconButton} from "@mui/material"
import { getRoute } from "../../helpers/routes.helper"
import PointsIcon from '@mui/icons-material/WorkspacePremium'
import ExchangePoints from '@mui/icons-material/CurrencyExchange'
import ExchangeToNFTInputDialog from '../../pages/Portal/MyPage/Profile/components/ExchangeToNFTInputDialog'
import { useState } from "react"
import { useDispatch } from "react-redux"
import { usePage } from "@inertiajs/inertia-react"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../store/slices/ToasterSlice"

const UserPoints = ({ user, translatables }) => {

    const { api } = usePage().props
    const dispatch = useDispatch()
    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        value: '',
        submitUrl: '',
        method: null,
        processing: false,
        type: '',
        exchange_item: 'points',
    })

    const handleExchange = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.exchange_points,
            text: '',
            submitUrl: '',
            method: 'post',
            action: 'exchange'
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = exchange_amount => {
        Inertia.visit(getRoute('mypage.profile.exchange.points', {exchange_amount}), {
            method: dialog.method,
            errorBag: dialog.action,
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.wallet.request_exchange
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    return (
        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                    <Grid container spacing={1} alignItems={'center'}>
                        <Grid item xs={1.5}>
                            <PointsIcon sx={{ color: '#FF6B09' }} />
                        </Grid>
                        <Grid item xs={8.5}>
                            <Typography variant="h6" children={translatables.texts.points} sx={{ color: '#FF6B09' }} />
                        </Grid>
                        <Grid item xs={2} alignContent={'flex-end'}>
                            <Tooltip title={`${translatables.texts.exchange_points}`}>
                                <IconButton onClick={handleExchange}>
                                    <ExchangePoints color="primary" />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={11} ml={1} textAlign={'center'}>
                            <Typography variant="h6" children={user.user_wallet.points} color={'grey'} />
                        </Grid>
                    </Grid>
                    <ExchangeToNFTInputDialog
                        {...dialog}
                        handleClose={handleOnDialogClose}
                        handleConfirm={handleOnDialogSubmit}
                    />
            </CardContent>
        </Card>
    );
}

export default UserPoints
