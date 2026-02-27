import { OpenInNew } from '@mui/icons-material'
import {
    Checkbox,
    Chip,
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

const DeliveryStatusBadge = ({ status, texts }) => {
    const statusConfig = {
        eligible: {
            color: 'info',
            label: texts?.delivery_eligible ?? 'Eligible',
        },
        delivered: {
            color: 'success',
            label: texts?.delivery_delivered ?? 'Delivered',
        },
        self_minted: {
            color: 'default',
            label: texts?.delivery_self_minted ?? 'Self-minted',
        },
        failed: {
            color: 'error',
            label: texts?.delivery_failed ?? 'Failed',
        },
        not_eligible: {
            color: 'warning',
            label: texts?.delivery_not_eligible ?? 'Not eligible',
        },
    }

    const config = statusConfig[status] ?? { color: 'default', label: status ?? '-' }

    return <Chip color={config.color} label={config.label} size="small" />
}

const CompletionStatusBadge = ({ status, texts }) => {
    const isCompleted = status === 'completed'
    return (
        <Chip
            color={isCompleted ? 'success' : 'default'}
            label={isCompleted ? (texts?.completed ?? 'Completed') : (texts?.in_progress ?? 'In progress')}
            size="small"
            variant="outlined"
        />
    )
}

const CertificateTable = ({
    students,
    selectedStudentIds,
    onToggleSelect,
    translatables,
    explorerUrl,
    hasRewards,
}) => {
    const texts = translatables?.texts ?? {}

    if (!students || students.length === 0) {
        return <EmptyCard />
    }

    const getExplorerUrl = (txHash) => {
        if (!explorerUrl || !txHash) return null
        return `${explorerUrl}/transaction/${txHash}`
    }

    const isSelected = (studentId) =>
        (selectedStudentIds ?? []).includes(studentId)

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {/* Checkbox column — only shown when rewards are configured */}
                        {hasRewards && <TableCell padding="checkbox" />}

                        <TableCell>{texts.student ?? 'Student'}</TableCell>
                        <TableCell align="center">{texts.completed_date ?? 'Completed'}</TableCell>
                        <TableCell align="center">{texts.completion_status ?? 'Progress'}</TableCell>

                        {/* Reward columns — hidden when no rewards */}
                        {hasRewards && (
                            <>
                                <TableCell align="center">{texts.delivery_status ?? 'Delivery'}</TableCell>
                                <TableCell align="center">{texts.transaction ?? 'Transaction'}</TableCell>
                            </>
                        )}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {students.map((student, index) => {
                        const isEligible = student.delivery_status === 'eligible'
                        const txHash = student.certificate_tx_hash
                        const explorerLink = txHash ? getExplorerUrl(txHash) : null

                        return (
                            <TableRow
                                key={student.id ?? index}
                                selected={isSelected(student.id)}
                            >
                                {/* Checkbox — only for eligible students */}
                                {hasRewards && (
                                    <TableCell padding="checkbox">
                                        {isEligible ? (
                                            <Checkbox
                                                checked={isSelected(student.id)}
                                                onChange={() => onToggleSelect(student.id)}
                                                size="small"
                                            />
                                        ) : null}
                                    </TableCell>
                                )}

                                <TableCell>
                                    {student.name ?? '-'}
                                </TableCell>

                                <TableCell align="center">
                                    {student.completed_at ?? '-'}
                                </TableCell>

                                <TableCell align="center">
                                    <CompletionStatusBadge
                                        status={student.completion_status}
                                        texts={texts}
                                    />
                                </TableCell>

                                {hasRewards && (
                                    <>
                                        <TableCell align="center">
                                            <DeliveryStatusBadge
                                                status={student.delivery_status}
                                                texts={texts}
                                            />
                                        </TableCell>

                                        <TableCell align="center">
                                            {txHash && student.delivery_status === 'delivered' ? (
                                                explorerLink ? (
                                                    <Link
                                                        href={explorerLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        underline="none"
                                                    >
                                                        <Tooltip title={texts.view_transaction ?? 'View transaction'}>
                                                            <IconButton size="small" color="primary">
                                                                <OpenInNew fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Link>
                                                ) : (
                                                    <Tooltip title={txHash}>
                                                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                            {txHash.substring(0, 8)}...
                                                        </span>
                                                    </Tooltip>
                                                )
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default CertificateTable
