import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { usePage } from '@inertiajs/inertia-react'
import { TaskAlt, RadioButtonUnchecked } from "@mui/icons-material"

const BadgesTable = ({ data }) => {
    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.type} align="center"/>
                <TableCell children={row.name} align="center"/>
                <TableCell children={row.formatted_datetime} align="center"/>
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
                        <TableCell children={translatables.texts.type} align="center"/>
                        <TableCell children={translatables.texts.badge_name} align="center"/>
                        <TableCell children={translatables.texts.date} align="center"/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData(data) }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default BadgesTable
