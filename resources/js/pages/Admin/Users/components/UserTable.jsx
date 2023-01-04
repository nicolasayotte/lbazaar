import { Link } from "@inertiajs/inertia-react"
import { Block, Check, Search } from "@mui/icons-material"
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const UserTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.email}/>
            <TableCell children={row.roles.join(', ')} align="center"/>
            <TableCell children={row.status} align="center"/>
            <TableCell children={row.date_joined} align="center"/>
            <TableCell align="center">
                <Link href={getRoute('admin.users.view', { id: row.id })}>
                    <IconButton title="View">
                        <Search />
                    </IconButton>
                </Link>
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
                        <TableCell children="Name"/>
                        <TableCell children="Email"/>
                        <TableCell children="Role" align="center"/>
                        <TableCell children="Status" align="center"/>
                        <TableCell children="Date Joined" align="center"/>
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

export default UserTable
