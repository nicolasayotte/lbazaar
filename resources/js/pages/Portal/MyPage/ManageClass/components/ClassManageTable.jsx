import { Link, usePage } from "@inertiajs/inertia-react"
import { RoomPreferences, Settings } from "@mui/icons-material"
import { Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { getRoute } from "../../../../../helpers/routes.helper"

const ClassManageTable = ({ data }) => {

    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => {

        const statusColors = {
            'Draft' : 'default',
            'Published': 'primary',
            'Completed'  : 'success'
        }


        return (
            <TableRow key={index}>
                <TableCell children={row.title}/>
                <TableCell children={row.type}/>
                <TableCell children={row.category}/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center" children={row.publishedDate}/>
                <TableCell  align="center">
                    <Chip size="small" label={row.status} color={statusColors[row.status]}/>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link title={translatables.title.class.manage.view} href={getRoute('mypage.course.manage_class.schedules', { id: row.id })}>
                            <IconButton size="small">
                                <Settings fontSize="inherit"/>
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
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell children="Title"/>
                            <TableCell children="Type"/>
                            <TableCell children="Category"/>
                            <TableCell children="Published"/>
                            <TableCell children="Status"/>
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

export default ClassManageTable
