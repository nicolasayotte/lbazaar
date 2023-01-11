import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"

const ConfirmationDialog = ({ open, title, text, handleClose, handleConfirm, processing = false, cancelButtonText = 'Cancel', confirmButtonText = 'Confirm' }) => {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
        >
            <DialogTitle children={title} sx={{ p: 2 }} />
            <DialogContent sx={{ p: 2 }}>
                <DialogContentText>
                    <span dangerouslySetInnerHTML={{ __html: text }} />
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button
                    children={cancelButtonText}
                    onClick={handleClose}
                />
                <Button
                    variant="contained"
                    disabled={processing}
                    children={confirmButtonText}
                    onClick={handleConfirm}
                />
            </DialogActions>
        </Dialog>
    )
}

export default ConfirmationDialog
