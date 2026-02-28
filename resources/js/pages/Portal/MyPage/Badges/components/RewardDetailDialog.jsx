import { OpenInNew } from '@mui/icons-material'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Link,
    Stack,
    Typography,
} from '@mui/material'
import { usePage } from '@inertiajs/inertia-react'

const LabeledValue = ({ label, value }) => (
    <Box>
        <Typography variant="caption" color="textSecondary">
            {label}
        </Typography>
        <Typography variant="body2">{value || '-'}</Typography>
    </Box>
)

const RewardDetailDialog = ({ open, reward, onClose }) => {
    const { translatables } = usePage().props
    const texts = translatables.texts

    if (!reward) {
        return null
    }

    const meta = reward.nft_metadata || {}
    const imageUrl = meta.image || null
    const nftName = meta.name || reward.course_name || '-'
    const nftDescription = meta.description || '-'
    const walletLabel = reward.wallet_destination === 'external'
        ? (texts.wallet_external || 'External Wallet')
        : (texts.wallet_custodial || 'Custodial Wallet')

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{texts.reward_detail_title || 'Reward Details'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {imageUrl && (
                        <Box display="flex" justifyContent="center">
                            <Box
                                component="img"
                                src={imageUrl}
                                alt={nftName}
                                sx={{
                                    maxWidth: 200,
                                    maxHeight: 200,
                                    objectFit: 'contain',
                                    borderRadius: 1,
                                }}
                            />
                        </Box>
                    )}

                    <LabeledValue label={texts.nft_name || 'NFT Name'} value={nftName} />
                    <LabeledValue label={texts.nft_description || 'NFT Description'} value={nftDescription} />

                    <Divider />

                    <LabeledValue label={texts.wallet_destination || 'Wallet'} value={walletLabel} />

                    {reward.tx_hash && (
                        <Box>
                            <Typography variant="caption" color="textSecondary">
                                {texts.on_chain_reference || 'On-chain Reference'}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    wordBreak: 'break-all',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                }}
                            >
                                {reward.tx_hash}
                            </Typography>
                        </Box>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    {texts.cancel || 'Close'}
                </Button>
                {reward.explorer_url && (
                    <Button
                        component={Link}
                        href={reward.explorer_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        endIcon={<OpenInNew />}
                        variant="contained"
                        color="primary"
                    >
                        {texts.view_on_explorer || 'View on Explorer'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}

export default RewardDetailDialog
