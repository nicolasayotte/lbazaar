import { useState } from 'react'
import { OpenInNew } from '@mui/icons-material'
import {
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
import RewardDetailDialog from './RewardDetailDialog'

const STATUS_CONFIG = {
    eligible:     { color: 'info',    label: 'Eligible' },
    pending:      { color: 'warning', label: 'Pending' },
    minting:      { color: 'warning', label: 'Minting' },
    minted:       { color: 'success', label: 'Delivered' },
    failed:       { color: 'error',   label: 'Failed' },
    revoked:      { color: 'default', label: 'Revoked' },
    not_eligible: { color: 'default', label: 'Not Eligible' },
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

const RewardsTable = ({ data }) => {
    const { translatables } = usePage().props
    const texts = translatables.texts

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedReward, setSelectedReward] = useState(null)

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
        setSelectedReward(null)
    }

    const isInProgress = (status) => status === 'pending' || status === 'minting'

    const rows = data.map((reward) => {
        const hasExplorer = reward.explorer_url && reward.delivery_status === 'minted'
        const inProgress  = isInProgress(reward.delivery_status)
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
                    {reward.wallet_destination === 'external'
                        ? (texts.wallet_external || 'External')
                        : (texts.wallet_custodial || 'Custodial')}
                </TableCell>
                <TableCell align="center">
                    {inProgress && <CircularProgress size={20} />}
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
                    {!inProgress && !hasExplorer && '-'}
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

            <RewardDetailDialog
                open={dialogOpen}
                reward={selectedReward}
                onClose={handleDialogClose}
            />
        </>
    )
}

export default RewardsTable
