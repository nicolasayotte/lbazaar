import { OpenInNew, Replay } from "@mui/icons-material"
import { Button, Chip, CircularProgress, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material"
import { Stack } from "@mui/system"
import EmptyCard from "../../../../../components/common/EmptyCard"

const StatusBadge = ({ status }) => {
    const statusConfig = {
        'eligible': { color: 'info', label: 'Eligible' },
        'minting': { color: 'warning', label: 'Minting' },
        'minted': { color: 'success', label: 'Minted' },
        'failed': { color: 'error', label: 'Failed' }
    }

    const config = statusConfig[status] || { color: 'default', label: status }

    return <Chip color={config.color} label={config.label} size="small" />
}

const CertificateTable = ({ students, onMint, onRetry, minting = {}, translatables, explorerUrl }) => {

    if (!students || students.length === 0) {
        return <EmptyCard />
    }

    const getExplorerUrl = (txHash) => {
        if (!explorerUrl) return null
        return `${explorerUrl}/transaction/${txHash}`
    }

    const displayTableData = students.map((student, index) => {
        const isMinting = minting[student.id] || false
        const showMintButton = student.certificate_status === 'eligible'
        const showRetryButton = student.certificate_status === 'failed'
        const hasTxHash = student.certificate_tx_hash && student.certificate_status === 'minted'

        const actionButtons = (
            <Stack direction="row" spacing={1} width="100%" justifyContent="center" alignItems="center">
                {showMintButton && (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => onMint(student.id)}
                        disabled={isMinting}
                        startIcon={isMinting ? <CircularProgress size={16} /> : null}
                    >
                        {isMinting ? translatables.texts.minting : translatables.texts.mint}
                    </Button>
                )}
                {showRetryButton && (
                    <Tooltip title={translatables.texts.retry}>
                        <span>
                            <IconButton
                                size="small"
                                color="primary"
                                onClick={() => onRetry(student.id)}
                                disabled={isMinting}
                            >
                                <Replay fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                )}
                {hasTxHash && (() => {
                    const url = getExplorerUrl(student.certificate_tx_hash)
                    return url ? (
                        <Link
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="none"
                        >
                            <Tooltip title={translatables.texts.view_transaction}>
                                <IconButton size="small" color="primary">
                                    <OpenInNew fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Link>
                    ) : (
                        <Tooltip title={translatables.texts.view_transaction}>
                            <span>
                                <IconButton size="small" color="primary" disabled>
                                    <OpenInNew fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    )
                })()}
                {!showMintButton && !showRetryButton && !hasTxHash && '-'}
            </Stack>
        )

        return (
            <TableRow key={index}>
                <TableCell>
                    {student.name || student.user?.name || '-'}
                </TableCell>
                <TableCell align="center">
                    {student.completed_at || student.certificate_minted_at || '-'}
                </TableCell>
                <TableCell align="center">
                    <StatusBadge status={student.certificate_status} />
                </TableCell>
                <TableCell align="center">
                    {hasTxHash ? (() => {
                        const url = getExplorerUrl(student.certificate_tx_hash)
                        return url ? (
                            <Link
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ fontSize: '0.875rem' }}
                            >
                                {student.certificate_tx_hash.substring(0, 8)}...
                            </Link>
                        ) : (
                            <span style={{ fontSize: '0.875rem' }}>
                                {student.certificate_tx_hash.substring(0, 8)}...
                            </span>
                        )
                    })() : '-'}
                </TableCell>
                <TableCell align="center">
                    {actionButtons}
                </TableCell>
            </TableRow>
        )
    })

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{translatables.texts.student}</TableCell>
                        <TableCell align="center">{translatables.texts.completed_date}</TableCell>
                        <TableCell align="center">{translatables.texts.status}</TableCell>
                        <TableCell align="center">{translatables.texts.transaction}</TableCell>
                        <TableCell align="center">{translatables.texts.actions}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default CertificateTable
