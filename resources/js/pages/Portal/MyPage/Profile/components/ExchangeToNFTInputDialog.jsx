import { usePage } from "@inertiajs/inertia-react"
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material"
import Input from "../../../../../components/forms/Input"
import { useState } from "react"

const ExchangeToNftInputDialog = ({ open, title, exchange_item, handleClose, handleConfirm, processing = false, cancelButtonText = '', confirmButtonText = '' }) => {

    const { translatables, auth } = usePage().props
    const [isDisabled, setDisabled] = useState(true)
    const handleOnChange = (e) => {
        const regex = /^[0-9\b]+$/
        if ((e.target.value !== '' || regex.test(e.target.value)) && auth.user.user_wallet[exchange_item] >= e.target.value) {
            setDisabled(false)
        } else {
            setDisabled(true)
        }
    }

    const handleFormOnSubmit = (e) => {
        handleConfirm(e.target.exchange_amount.value)
        e.preventDefault()
    }
    cancelButtonText = cancelButtonText || translatables.texts.cancel
    confirmButtonText = confirmButtonText || translatables.texts.confirm

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
        >
            <form onSubmit={handleFormOnSubmit}>
                <DialogTitle children={title} sx={{ p: 2 }} />
                <DialogContent sx={{ p: 2 }}>
                    <DialogContentText sx={{ p: 1 }}>
                    </DialogContentText>
                    <Input
                        label={`${translatables.texts[exchange_item]} ${translatables.texts.to_convert_to_nft}`}
                        name="exchange_amount"
                        onChange={handleOnChange}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        children={cancelButtonText}
                        onClick={handleClose}
                        disabled={processing}
                    />
                    { isDisabled ? (
                        <Button
                            variant="contained"
                            disabled={isDisabled}
                            children={confirmButtonText}
                        />
                    ) : (
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={processing}
                            children={confirmButtonText}
                        />
                    )}
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default ExchangeToNftInputDialog
