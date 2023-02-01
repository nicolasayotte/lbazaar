import { usePage } from "@inertiajs/inertia-react"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"

const FormDialog = ({ open, title, processing, handleClose, handleSubmit, confirmButtonText = '', cancelButtonText='', children }) => {

    const { translatables } = usePage().props

    cancelButtonText = cancelButtonText || translatables.texts.cancel
    confirmButtonText = confirmButtonText || translatables.texts.submit

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="xs"
            keepMounted
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle children={title} />
                <DialogContent>
                    {children}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        children={cancelButtonText}
                        onClick={handleClose}
                        disabled={processing}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={processing}
                        children={confirmButtonText}
                        onClick={handleSubmit}
                    />
                </DialogActions>
            </form>
        </Dialog>
    )
}

export default FormDialog
