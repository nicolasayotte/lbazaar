import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, IconButton, Box } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from '@inertiajs/inertia-react'
import { Link } from "@inertiajs/inertia-react"
import route, { getRoute } from "../../../../../helpers/routes.helper"
import { Search , Iso } from "@mui/icons-material"
const WalletHistoryTable = ({ data }) => {

    const { translatables } = usePage().props
    const displayTableData = rows => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.id} align="center"/>
                <TableCell children={row.type} align="center"/>
                <TableCell children={row.amount} align="center"/>
                <TableCell children={row.transaction_details} align="center"/>
                <TableCell children={row.points_after} align="center"/>
                <TableCell children={row.transaction_datetime} align="center"/>
            </TableRow>
        )
    })

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.wallet_history.id} align="center"/>
                        <TableCell children={translatables.wallet_history.type} align="center"/>
                        <TableCell align="center">
                            <Box display={'flex'}>
                                {translatables.texts.points}
                                <Iso />
                            </Box>
                        </TableCell>
                        <TableCell children={translatables.texts.content} align="center"/>
                        <TableCell children={translatables.texts.wallet_balance} align="center"/>
                        <TableCell children={translatables.texts.transaction_date} align="center"/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData(data) }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default WalletHistoryTable
