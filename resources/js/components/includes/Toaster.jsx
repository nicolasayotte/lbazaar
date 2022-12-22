import { Close } from "@mui/icons-material"
import { Alert, Button, IconButton, Snackbar } from "@mui/material"
import { useSelector, useDispatch } from 'react-redux'
import { actions } from '../../store/slices/ToasterSlice'

const Toaster = () => {
    const toaster = useSelector(state => state.toaster)

    const dispatch = useDispatch()

    const handleCloseToaster = () => {
        dispatch(actions.hide())
    }

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
