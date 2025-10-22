import { usePage } from "@inertiajs/inertia-react"
import { Close } from "@mui/icons-material"
import { Alert, IconButton, Snackbar } from "@mui/material"
import { useEffect } from "react"
import { useSelector, useDispatch } from 'react-redux'
import { actions } from '../../store/slices/ToasterSlice'

const Toaster = () => {
    const dispatch = useDispatch()

    const toaster = useSelector(state => state.toaster)

    const { flash } = usePage().props

    const handleCloseToaster = () => {
        dispatch(actions.hide())
    }

    useEffect(() => {
        if (flash.success) {
            dispatch(actions.success({
                message: flash.success
            }))
        }

        if (flash.error) {
            dispatch(actions.error({
                message: flash.error
            }))
        }
    }, [flash])

    return (
        <Snackbar
            open={toaster.open}
            autoHideDuration={toaster.duration}
            onClose={handleCloseToaster}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
        >
            <Alert
                severity={toaster.type}
                onClose={handleCloseToaster}
                variant="filled"
                sx={{
                    ml: 'auto'
                }}
                action={
                    <IconButton
                        color="inherit"
                        size="small"
                        onClick={handleCloseToaster}
                    >
                        <Close fontSize="small" />
                    </IconButton>
                }
                children={toaster.message}
            />
        </Snackbar>
    )
}

export default Toaster
