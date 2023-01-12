import { Link } from "@inertiajs/inertia-react"
import { Block, Check, Search, InsertComment } from "@mui/icons-material"
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const CourseHistoryTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.type} align="center"/>
            <TableCell children={row.category} align="center"/>
            <TableCell children={row.title} align="center"/>
            <TableCell children={row.teacher} align="center"/>
            <TableCell children={row.status} align="center"/>
            <TableCell children={row.booked_date} align="center"/>
            <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                <Link href={getRoute('course.details', {id : row.id})}>
                    <IconButton title="View" variant="text" size="small">
                        <Search fontSize="inherit" />
                    </IconButton>
                </Link>
                <IconButton title="Give Feedback" variant="text" size="small">
                    <InsertComment fontSize="inherit" />
                </IconButton>
            </TableCell>
        </TableRow>
    ))

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children="Type" align="center"/>
                        <TableCell children="Category" align="center"/>
                        <TableCell children="Course" align="center"/>
                        <TableCell children="Teacher" align="center"/>
                        <TableCell children="Status" align="center"/>
                        <TableCell children="Booked Date" align="center"/>
                        <TableCell children="Actions" align="center"/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData(data) }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default CourseHistoryTable
