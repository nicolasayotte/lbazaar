import { Link, usePage } from "@inertiajs/inertia-react"
import { NoteAdd, Search } from "@mui/icons-material"
import { Chip, IconButton, Paper, Tooltip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import routes, { getRoute } from "../../../../../helpers/routes.helper"

const ClassApplicationTable = ({ data }) => {

    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => {

        const statusColors = {
            'Pending' : 'default',
            'Approved': 'success',
            'Denied'  : 'error'
        }

        const displayCreateClass = (id, status, isCourseCreated) => {
            return (
                <IconButton title={translatables.title.class.create} size="small" color="success" disabled={(status != 'Approved' || isCourseCreated)}>
                    <Link href={getRoute('course.create', { id })}>
                        <NoteAdd fontSize="inherit"/>
                    </Link>
                </IconButton>
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
                            <IconButton title={translatables.texts.view} size="small">
                                <Search fontSize="inherit"/>
                            </IconButton>
                        </Link>
                        {displayCreateClass(row.id, row.status, row.isCourseCreated)}
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
                            <TableCell children={translatables.texts.title}/>
                            <TableCell align="center" children={translatables.texts.type}/>
                            <TableCell align="center" children={translatables.texts.category}/>
                            <TableCell align="center" children={translatables.texts.date_applied}/>
                            <TableCell align="center" children={translatables.texts.status}/>
                            <TableCell align="center" children={translatables.texts.actions}/>
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
