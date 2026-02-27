import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Link as MuiLink,
    Box,
    Button,
    Typography,
} from "@mui/material"
import CreditCardIcon from "@mui/icons-material/CreditCard"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from "@inertiajs/inertia-react"
import routes from "../../../../../helpers/routes.helper"

const STATUS_COLORS = {
    confirmed: 'success',
    succeeded: 'success',
    pending: 'warning',
    failed: 'error',
    canceled: 'error',
    refunded: 'info',
}

const PurchaseHistoryTable = ({ data, requiredConfirmations = 10 }) => {

    const { translatables } = usePage().props

    const getStatusLabel = (status) => {
        const map = {
            confirmed: translatables.texts.status_confirmed,
            succeeded: translatables.texts.status_succeeded,
            pending: translatables.texts.status_pending,
            failed: translatables.texts.status_failed,
            canceled: translatables.texts.status_canceled,
            refunded: translatables.texts.status_refunded,
        }
        return map[status] || status
    }

    const getStatusColor = (status) => STATUS_COLORS[status] || 'default'

    const renderPaymentMethod = (type) => {
        if (type === 'ADA') {
            return (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                        component="span"
                        sx={{
                            bgcolor: '#0D1E2D',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.5,
                            lineHeight: 1.4,
                        }}
                    >
                        ADA
                    </Box>
                </Box>
            )
        }
        return (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <CreditCardIcon fontSize="small" color="action" />
                <Typography variant="body2">{translatables.texts.credit_card}</Typography>
            </Box>
        )
    }

    const renderReference = (row) => {
        if (row.explorer_url) {
            return (
                <MuiLink href={row.explorer_url} target="_blank" rel="noopener noreferrer">
                    {row.tx_hash ? row.tx_hash.substring(0, 12) + '...' : 'View'}
                </MuiLink>
            )
        }
        if (row.receipt_url) {
            return (
                <MuiLink href={row.receipt_url} target="_blank" rel="noopener noreferrer">
                    {translatables.texts.view_receipt}
                </MuiLink>
            )
        }
        return '—'
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString()
    }

    if (!data || data.length === 0) {
        return (
            <Box>
                <EmptyCard message={translatables.texts.no_purchases} />
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                    <Button
                        variant="contained"
                        href={routes["course.index"]}
                        component="a"
                    >
                        {translatables.texts.browse_classes}
                    </Button>
                </Box>
            </Box>
        )
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell align="center">{translatables.texts.class_name}</TableCell>
                        <TableCell align="center">{translatables.texts.payment_method}</TableCell>
                        <TableCell align="center">{translatables.texts.payment_amount}</TableCell>
                        <TableCell align="center">{translatables.texts.date}</TableCell>
                        <TableCell align="center">{translatables.texts.status}</TableCell>
                        <TableCell align="center">{translatables.texts.transaction_reference}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id}>
                            <TableCell align="center">{row.course_name}</TableCell>
                            <TableCell align="center">{renderPaymentMethod(row.type)}</TableCell>
                            <TableCell align="center">{row.amount}</TableCell>
                            <TableCell align="center">{formatDate(row.date)}</TableCell>
                            <TableCell align="center">
                                <Chip
                                    label={getStatusLabel(row.status)}
                                    color={getStatusColor(row.status)}
                                    size="small"
                                />
                                {row.type === 'ADA' && row.status === 'pending' && (
                                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {translatables.texts.payment_confirmations
                                            .replace(':current', '?')
                                            .replace(':required', requiredConfirmations)}
                                    </Typography>
                                )}
                            </TableCell>
                            <TableCell align="center">{renderReference(row)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default PurchaseHistoryTable
