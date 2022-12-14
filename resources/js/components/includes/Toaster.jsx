import { Alert, Snackbar } from "@mui/material"
import { useSelector, useDispatch } from 'react-redux'
import { actions } from '../../store/slices/ToasterSlice'

const Toaster = () => {
    const toaster = useSelector(state => state.toaster)

    const dispatch = useDispatch()

    const handleCloseToaster = () => {
        dispatch(actions.toggle({ open: false }))
    }

    return (
        <Snackbar
            open={toaster.open}
            autoHideDuration={5000}
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
            >{toaster.message}</Alert>
        </Snackbar>
    )
}

export default Toaster
