import { useState } from 'react'
import { OpenInNew } from '@mui/icons-material'
import {
    Alert,
    Button,
    Chip,
    CircularProgress,
    IconButton,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from '@mui/material'
import EmptyCard from '../../../../../components/common/EmptyCard'
import { usePage } from '@inertiajs/inertia-react'
import axios from 'axios'
import RewardDetailDialog from './RewardDetailDialog'

const STATUS_CONFIG = {
    eligible:        { color: 'info',    label: 'Eligible' },
    pending:         { color: 'warning', label: 'Pending' },
    minting:         { color: 'warning', label: 'Minting' },
    minted:          { color: 'success', label: 'Delivered' },
    failed:          { color: 'error',   label: 'Failed' },
    revoked:         { color: 'default', label: 'Revoked' },
    not_eligible:    { color: 'default', label: 'Not Eligible' },
    clawback_flagged: { color: 'warning', label: 'Clawback Flagged' },
}

const DeliveryStatusChip = ({ status }) => {
    const config = STATUS_CONFIG[status] || { color: 'default', label: status || 'N/A' }
    return <Chip color={config.color} label={config.label} size="small" />
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year:  'numeric',
        month: 'short',
        day:   'numeric',
    })
}

const RewardsTable = ({ data, walletAPI }) => {
    const { translatables } = usePage().props
    const texts = translatables.texts

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedReward, setSelectedReward] = useState(null)
    const [mintingId, setMintingId] = useState(null)
    const [mintStep, setMintStep] = useState(null)
    const [mintError, setMintError] = useState(null)

    if (!data || data.length <= 0) {
        return <EmptyCard message={texts.no_rewards} />
    }

    const handleRowClick = (reward) => {
        if (reward.reward_type === 'certificate' && reward.nft_metadata) {
            setSelectedReward(reward)
            setDialogOpen(true)
        }
    }

    const handleDialogClose = () => {
        setDialogOpen(false)
    }

    const handleDialogExited = () => {
        setSelectedReward(null)
    }

    /**
     * CIP-30 double-signed mint flow:
     * 1. Get UTXOs + change address from connected wallet
     * 2. POST /wallet/build-mint-tx → backend builds tx, owner-signs it
     * 3. Student co-signs via walletAPI.signTx(cbor, true)
     * 4. Student submits via walletAPI.submitTx(signedTx)
     */
    const handleCip30Mint = async (e, reward) => {
        e.stopPropagation()
        setMintingId(reward.id)
        setMintError(null)

        try {
            // 1. Get wallet data via CIP-30
            setMintStep('Building transaction...')
            const changeAddr = await walletAPI.getChangeAddress()
            const utxos = await walletAPI.getUtxos()

            if (!utxos || utxos.length === 0) {
                throw new Error('No UTXOs available in your wallet. Please ensure you have funds.')
            }

            // 2. Ask backend to build + owner-sign the tx
            const { data: buildResult } = await axios.post('/wallet/build-mint-tx', {
                type: reward.reward_type,
                course_id: reward.course_id,
                schedule_id: reward.schedule_id,
                changeAddr,
                utxos,
            })

            if (!buildResult.success) {
                throw new Error(buildResult.message || 'Failed to build transaction')
            }

            // 3. Student co-signs (partial = true, owner already signed)
            setMintStep('Please sign in your wallet...')
            const cborSig = await walletAPI.signTx(buildResult.cborTx, true)

            // 4. Send signature to server — server merges witness sets and submits
            setMintStep('Submitting to blockchain...')
            const { data: submitResult } = await axios.post('/wallet/submit-mint-tx', {
                type: reward.reward_type,
                course_id: reward.course_id,
                schedule_id: reward.schedule_id,
                cborSig,
                cborTx: buildResult.cborTx,
            })

            if (!submitResult.success) {
                throw new Error(submitResult.message || 'Failed to submit transaction')
            }

            setMintStep('Minted! Reloading...')
            window.location.reload()
        } catch (err) {
            // CIP-30 user declined (code 2 or 3)
            if (err?.code === 2 || err?.code === 3 || err?.code === -3) {
                setMintError('Transaction signing was declined.')
            } else {
                setMintError(err?.response?.data?.message || err?.message || 'Minting failed. Please try again.')
            }
            setMintingId(null)
            setMintStep(null)
        }
    }

    /**
     * Fallback: server-side mint (custodial / no wallet connected)
     */
    const handleServerMint = async (e, reward) => {
        e.stopPropagation()
        setMintingId(reward.id)
        setMintError(null)
        setMintStep('Minting...')
        try {
            await axios.post(`/classes/${reward.course_id}/attend/${reward.schedule_id}/self-mint`, {
                type: reward.reward_type,
            })
            setMintStep('Minted! Reloading...')
            window.location.reload()
        } catch (err) {
            setMintError(err.response?.data?.message || 'Minting failed. Please try again.')
            setMintingId(null)
            setMintStep(null)
        }
    }

    const handleMint = walletAPI ? handleCip30Mint : handleServerMint

    const isInProgress = (status) => status === 'pending' || status === 'minting'

    const rows = data.map((reward) => {
        const hasExplorer = reward.explorer_url && reward.delivery_status === 'minted'
        const inProgress  = isInProgress(reward.delivery_status)
        const isEligible  = reward.delivery_status === 'eligible'
        const isMinting   = mintingId === reward.id
        const isCertWithMeta = reward.reward_type === 'certificate' && reward.nft_metadata
        const rewardTypeLabel = reward.reward_type === 'certificate'
            ? (texts.reward_type_certificate || 'Certificate')
            : (texts.reward_type_token || 'Token')

        return (
            <TableRow
                key={reward.id}
                hover={isCertWithMeta}
                onClick={() => handleRowClick(reward)}
                sx={{ cursor: isCertWithMeta ? 'pointer' : 'default' }}
            >
                <TableCell>{reward.course_name || '-'}</TableCell>
                <TableCell align="center">{rewardTypeLabel}</TableCell>
                <TableCell align="center">
                    {reward.reward_type === 'token' && reward.amount != null
                        ? reward.amount
                        : '-'}
                </TableCell>
                <TableCell align="center">
                    <DeliveryStatusChip status={reward.delivery_status} />
                </TableCell>
                <TableCell align="center">{formatDate(reward.delivery_date)}</TableCell>
                <TableCell align="center">
                    {(reward.wallet_type ?? reward.wallet_destination) === 'external'
                        ? (texts.wallet_external || 'External')
                        : (texts.wallet_custodial || 'Custodial')}
                </TableCell>
                <TableCell align="center">
                    {inProgress && <CircularProgress size={20} />}
                    {isEligible && (
                        isMinting ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="caption" color="text.secondary" noWrap>
                                    {mintStep}
                                </Typography>
                            </Box>
                        ) : (
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                disabled={!!mintingId}
                                onClick={(e) => handleMint(e, reward)}
                            >
                                {texts.mint || 'Mint'}
                            </Button>
                        )
                    )}
                    {hasExplorer && (
                        <Tooltip title={texts.view_on_explorer || 'View on Explorer'}>
                            <Link
                                href={reward.explorer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="none"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <IconButton size="small" color="primary">
                                    <OpenInNew fontSize="small" />
                                </IconButton>
                            </Link>
                        </Tooltip>
                    )}
                    {!inProgress && !isEligible && !hasExplorer && '-'}
                </TableCell>
            </TableRow>
        )
    })

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>{texts.course_title || 'Course'}</TableCell>
                            <TableCell align="center">{texts.reward_type || 'Reward Type'}</TableCell>
                            <TableCell align="center">{texts.reward_amount || 'Amount'}</TableCell>
                            <TableCell align="center">{texts.delivery_status || 'Status'}</TableCell>
                            <TableCell align="center">{texts.delivery_date || 'Delivery Date'}</TableCell>
                            <TableCell align="center">{texts.wallet_destination || 'Wallet'}</TableCell>
                            <TableCell align="center">{texts.transaction || 'Transaction'}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>{rows}</TableBody>
                </Table>
            </TableContainer>

            {mintError && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setMintError(null)}>
                    {mintError}
                </Alert>
            )}

            <RewardDetailDialog
                open={dialogOpen}
                reward={selectedReward}
                onClose={handleDialogClose}
                onExited={handleDialogExited}
            />
        </>
    )
}

export default RewardsTable
