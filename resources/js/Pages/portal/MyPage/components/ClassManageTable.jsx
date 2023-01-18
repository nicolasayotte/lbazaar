import { Link } from "@inertiajs/inertia-react"
import { Block, RoomPreferences, Search } from "@mui/icons-material"
import { Chip, IconButton, Paper, Tooltip, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const ClassManageTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => {

        const statusColors = {
            'Pending' : 'default',
            'Approved': 'success',
            'Denied'  : 'error'
        }

        return (
            <TableRow key={index}>
                <TableCell children={row.title}/>
                <TableCell  sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link title="Manage class" href={getRoute('admin.class.applications.view', { id: row.id })}>
                            <IconButton size="small" color="success">
                                <RoomPreferences fontSize="inherit"/>
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
