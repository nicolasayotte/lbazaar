import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Typography,
} from '@mui/material'

const AirdropFeeDialog = ({ open, loading, feeData, totalEligibleCount, onConfirm, onClose, translatables }) => {
    const texts = translatables?.texts ?? {}

    const formatAda = (lovelace) => {
        return (lovelace / 1_000_000).toFixed(2)
    }

    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {texts.airdrop_fee_title ?? 'Airdrop Cost Estimate'}
            </DialogTitle>

            <DialogContent>
                {loading && (
                    <Stack alignItems="center" spacing={2} py={2}>
                        <CircularProgress />
                        <Typography variant="body2">
                            {texts.estimating_fee ?? 'Estimating fee...'}
                        </Typography>
                    </Stack>
                )}

                {!loading && feeData && (
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body1">
                                {texts.students_selected ?? 'Students selected'}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                {totalEligibleCount != null && totalEligibleCount !== feeData.student_count
                                    ? (texts.students_selected_of ?? '{selected} of {total} eligible students selected')
                                        .replace('{selected}', feeData.student_count)
                                        .replace('{total}', totalEligibleCount)
                                    : feeData.student_count}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body1">
                                {texts.fee_per_student ?? 'Cost per student'}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                &#x20B3;{formatAda(feeData.per_student_lovelace)}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body1">
                                {texts.total_fee ?? 'Total estimated cost'}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                &#x20B3;{feeData.fee_ada}
                            </Typography>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body1">
                                {texts.wallet_balance_label ?? 'Wallet balance'}
                            </Typography>
                            <Typography variant="body1">
                                &#x20B3;{formatAda(feeData.wallet_balance_lovelace)}
                            </Typography>
                        </Stack>

                        {feeData.insufficient && (
                            <Alert severity="error">
                                {texts.insufficient_funds_detail
                                    ? texts.insufficient_funds_detail.replace(
                                        '{shortfall}',
                                        formatAda(feeData.shortfall_lovelace)
                                    )
                                    : `Insufficient funds. You need an additional ₳${formatAda(feeData.shortfall_lovelace)} to proceed.`}
                            </Alert>
                        )}
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    {texts.cancel ?? 'Cancel'}
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    onClick={onConfirm}
                    disabled={loading || !feeData || feeData.insufficient}
                >
                    {texts.confirm_airdrop ?? 'Confirm Airdrop'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default AirdropFeeDialog
