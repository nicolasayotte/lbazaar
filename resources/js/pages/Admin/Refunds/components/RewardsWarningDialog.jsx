import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import { usePage } from '@inertiajs/inertia-react'

const RewardsWarningDialog = ({ open, onClose, onForceConfirm, processing = false }) => {
    const { translatables } = usePage().props

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {translatables?.refund?.has_rewards_warning_title ?? 'Student Has Earned Rewards'}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {translatables?.refund?.has_rewards_warning_body ?? 'This student has already earned rewards for this course. Proceeding will revoke their rewards. Are you sure?'}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} disabled={processing}>
                    {translatables?.texts?.cancel ?? 'Cancel'}
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onForceConfirm}
                    disabled={processing}
                >
                    {translatables?.refund?.force_refund ?? 'Force Refund'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default RewardsWarningDialog
