import { Link } from "@inertiajs/inertia-react"
import { Block, NoteAdd, Search } from "@mui/icons-material"
import { Chip, IconButton, Paper, Tooltip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import routes, { getRoute } from "../../../../helpers/routes.helper"

const ClassApplicationTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => {

        const statusColors = {
            'Pending' : 'default',
            'Approved': 'success',
            'Denied'  : 'error'
        }

        const title = {
            'Pending' : 'Currently for approval',
            'Approved' : 'Create Class',
            'Denied'  : 'Application denied'
        }

        const displayCreateClass = (status, isCourseCreated) => {
            return (
                <Tooltip title={isCourseCreated ? 'Class already created' : title[status]}>
                    <span>
                        <IconButton size="small" color="success" disabled={(status != 'Approved' || isCourseCreated)}>
                            <NoteAdd fontSize="inherit"/>
                        </IconButton>
                    </span>
                </Tooltip>
            )
        }

        return (
            <TableRow key={index}>
                <TableCell children={row.title}/>
                <TableCell align="center" children={row.type}/>
                <TableCell align="center" children={row.category}/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center" children={row.created_at}/>
                <TableCell align="center">
                    <Chip size="small" label={row.status} color={statusColors[row.status]}/>
                </TableCell>
                <TableCell  sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link href={getRoute('mypage.course.applications.view', { id: row.id }, {returnUrl : routes["mypage.course.applications.index"]})}>
                            <IconButton size="small">
                                <Search fontSize="inherit"/>
                            </IconButton>
                        </Link>
                        {displayCreateClass(row.status, row.isCourseCreated)}
                    </Stack>
                </TableCell>
            </TableRow>
        )
    })

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell children="Title"/>
                            <TableCell align="center" children="Type"/>
                            <TableCell align="center" children="Category"/>
                            <TableCell align="center" children="Date Applied"/>
                            <TableCell align="center" children="Status"/>
                            <TableCell align="center" children="Actions"/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayTableData(data)}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default ClassApplicationTable
