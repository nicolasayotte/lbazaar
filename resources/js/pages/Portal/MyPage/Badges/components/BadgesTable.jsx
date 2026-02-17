import { OpenInNew } from "@mui/icons-material"
import { Chip, CircularProgress, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from '@inertiajs/inertia-react'

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'not_eligible': { color: 'info', label: 'Eligible' },
        'pending': { color: 'warning', label: 'Pending' },
        'minted': { color: 'success', label: 'Minted' },
        'failed': { color: 'error', label: 'Failed' }
    }

    const config = statusConfig[status] || { color: 'default', label: status || 'N/A' }

    return <Chip color={config.color} label={config.label} size="small" />
}

const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

const BadgesTable = ({ data }) => {
    const { translatables } = usePage().props

    if (!data || data.length <= 0) {
        return <EmptyCard />
    }

    const displayTableData = data.map((certificate, index) => {
        const hasTxHash = certificate.certificate_tx_hash && certificate.certificate_status === 'minted'
        const isMinting = certificate.certificate_status === 'pending'

        return (
            <TableRow key={index}>
                <TableCell>{certificate.course_name || '-'}</TableCell>
                <TableCell align="center">{certificate.professor_name || '-'}</TableCell>
                <TableCell align="center">{formatDate(certificate.completed_at)}</TableCell>
                <TableCell align="center">
                    <StatusBadge status={certificate.certificate_status} />
                </TableCell>
                <TableCell align="center">
                    {isMinting && (
                        <CircularProgress size={20} />
                    )}
                    {hasTxHash && (
                        <Tooltip title={translatables.texts.view_transaction || 'View on Cardano Explorer'}>
                            <Link
                                href={certificate.certificate_explorer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                underline="none"
                            >
                                <IconButton size="small" color="primary">
                                    <OpenInNew fontSize="small" />
                                </IconButton>
                            </Link>
                        </Tooltip>
                    )}
                    {!isMinting && !hasTxHash && '-'}
                </TableCell>
            </TableRow>
        )
    })

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{translatables.texts.course_title || 'Course'}</TableCell>
                        <TableCell align="center">{translatables.texts.professor || 'Instructor'}</TableCell>
                        <TableCell align="center">{translatables.texts.completed_date || 'Completed'}</TableCell>
                        <TableCell align="center">{translatables.texts.status || 'Status'}</TableCell>
                        <TableCell align="center">{translatables.texts.transaction || 'Transaction'}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default BadgesTable
