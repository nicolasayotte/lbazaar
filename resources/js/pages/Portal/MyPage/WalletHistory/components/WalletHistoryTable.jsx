import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack, IconButton } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from '@inertiajs/inertia-react'
import { Link } from "@inertiajs/inertia-react"
import route, { getRoute } from "../../../../../helpers/routes.helper"
import { Search } from "@mui/icons-material"

const WalletHistoryTable = ({ data }) => {

    const { translatables } = usePage().props
    const displayTableData = rows => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.id} align="center"/>
                <TableCell children={row.type} align="center"/>
                <TableCell children={`${translatables.texts.from} ${row.points_before}  ${translatables.texts.to} ${row.points_after}`} align="center"/>
                <TableCell children={row.course_name} align="center"/>
                <TableCell children={row.transaction_datetime} align="center"/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link href={getRoute('course.details', {id : row.id})}>
                            <IconButton title="View" variant="text" size="small">
                                <Search fontSize="inherit" />
                            </IconButton>
                        </Link>
                    </Stack>
                </TableCell>
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
                        <TableCell children={translatables.texts.class} align="center"/>
                        <TableCell children={translatables.texts.transaction_date} align="center"/>
                        <TableCell children={translatables.texts.content} align="center"/>
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
