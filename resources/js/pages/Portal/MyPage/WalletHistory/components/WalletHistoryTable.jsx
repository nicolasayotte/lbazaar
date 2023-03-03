import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from '@inertiajs/inertia-react'

const WalletHistoryTable = ({ data }) => {

    const { translatables } = usePage().props
    const displayTableData = rows => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.id} align="center"/>
                <TableCell children={row.type} align="center"/>
                <TableCell children={`${translatables.texts.from} ${row.points_before}  ${translatables.texts.to} ${row.points_after}`} align="center"/>
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
                        <TableCell children={translatables.texts.points} align="center"/>
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
