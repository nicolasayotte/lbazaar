import { Link } from "@inertiajs/inertia-react"
import { Search, InsertComment } from "@mui/icons-material"
import { Box, IconButton, Chip, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import route, { getRoute } from "../../../../../helpers/routes.helper"

const CourseHistoryTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => {

        const statusColors = {
            'Ongoing' : 'default',
            'Completed': 'success'
        }

        return (
            <TableRow key={index}>
                <TableCell children={row.title} align="center"/>
                <TableCell children={row.type} align="center"/>
                <TableCell children={row.category} align="center"/>
                <TableCell children={row.teacher} align="center"/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} children={row.booked_date} align="center"/>
                <TableCell align="center">
                    <Chip size="small" label={row.status} color={statusColors[row.status]}/>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link href={getRoute('course.details', {id : row.id})}>
                            <IconButton title="View" variant="text" size="small">
                                <Search fontSize="inherit" />
                            </IconButton>
                        </Link>
                        <Link href={getRoute('course.feedback.index', {id : row.id}, {returnUrl : route['mypage.course.history.index']})}>
                            <IconButton title={!row.hasFeedback ? "Give Feedback" : "Edit Feedback"} variant="text" size="small">
                                <InsertComment fontSize="inherit" color="primary"/>
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
                        <TableCell children="Class" align="center"/>
                        <TableCell children="Type" align="center"/>
                        <TableCell children="Category" align="center"/>
                        <TableCell children="Teacher" align="center"/>
                        <TableCell children="Booked Date" align="center"/>
                        <TableCell children="Status" align="center"/>
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
