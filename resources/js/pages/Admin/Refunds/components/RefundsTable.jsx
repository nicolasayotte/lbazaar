import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip } from '@mui/material'
import { Undo } from '@mui/icons-material'
import { usePage } from '@inertiajs/inertia-react'
import EmptyCard from '../../../../components/common/EmptyCard'

const RefundsTable = ({ data, onRefund }) => {
    const { translatables } = usePage().props

    if (!data || data.length === 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>{translatables?.texts?.name ?? 'Name'}</TableCell>
                        <TableCell>{translatables?.texts?.email ?? 'Email'}</TableCell>
                        <TableCell>{translatables?.texts?.course_name ?? 'Course'}</TableCell>
                        <TableCell align="center">{translatables?.texts?.payment_method ?? 'Payment Method'}</TableCell>
                        <TableCell align="right">{translatables?.texts?.amount ?? 'Amount'}</TableCell>
                        <TableCell align="center">{translatables?.texts?.date ?? 'Date'}</TableCell>
                        <TableCell align="center">{translatables?.texts?.actions ?? 'Actions'}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row, index) => (
                        <TableRow key={`${row.type}-${index}`}>
                            <TableCell>{row.student_name}</TableCell>
                            <TableCell>{row.student_email}</TableCell>
                            <TableCell>{row.course_name}</TableCell>
                            <TableCell align="center">
                                <Chip
                                    label={row.type === 'stripe' ? 'Stripe' : 'ADA'}
                                    color={row.type === 'stripe' ? 'primary' : 'secondary'}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell align="right">{row.amount}</TableCell>
                            <TableCell align="center">{row.payment_date}</TableCell>
                            <TableCell align="center">
                                <IconButton
                                    size="small"
                                    title={translatables?.texts?.refund ?? 'Refund'}
                                    onClick={() => onRefund(row)}
                                >
                                    <Undo fontSize="inherit" color="warning" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default RefundsTable
