import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material'

const AirdropResultsDialog = ({ open, results, onClose, onRetryFailed, translatables }) => {
    const texts = translatables?.texts ?? {}

    if (!results) return null

    const allResults = results.data?.results ?? results.results ?? []
    const succeeded = allResults.filter((r) => r.success)
    const failed    = allResults.filter((r) => !r.success)

    const handleRetry = () => {
        const failedIds = failed.map((r) => r.student_id)
        onRetryFailed(failedIds)
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {texts.airdrop_results_title ?? 'Airdrop Results'}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2}>
                    {succeeded.length > 0 && (
                        <Alert severity="success">
                            {texts.airdrop_success_count
                                ? texts.airdrop_success_count.replace('{count}', succeeded.length)
                                : `${succeeded.length} certificate(s) airdropped successfully.`}
                        </Alert>
                    )}

                    {failed.length > 0 && (
                        <>
                            <Alert severity="error">
                                {texts.airdrop_failed_count
                                    ? texts.airdrop_failed_count.replace('{count}', failed.length)
                                    : `${failed.length} airdrop(s) failed.`}
                            </Alert>

                            <Divider />

                            <Typography variant="subtitle2">
                                {texts.failed_students ?? 'Failed students:'}
                            </Typography>

                            <List dense disablePadding>
                                {failed.map((r) => (
                                    <ListItem key={r.student_id} disableGutters>
                                        <ListItemText
                                            primary={r.student_name ?? `Student #${r.student_id}`}
                                            secondary={r.reason ?? r.message ?? texts.unknown_error ?? 'Unknown error'}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </>
                    )}

                    {succeeded.length === 0 && failed.length === 0 && (
                        <Alert severity="info">
                            {texts.no_results ?? 'No results to display.'}
                        </Alert>
                    )}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>
                    {texts.close ?? 'Close'}
                </Button>
                {failed.length > 0 && (
                    <Button variant="outlined" color="warning" onClick={handleRetry}>
                        {texts.retry_failed ?? 'Retry Failed'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default AirdropResultsDialog
