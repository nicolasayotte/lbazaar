import { Block, Check, Search } from "@mui/icons-material"
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"

const UserTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.email}/>
            <TableCell children={row.roles} align="center"/>
            <TableCell children={row.status} align="center"/>
            <TableCell children={row.date_joined} align="center"/>
            <TableCell align="center">
                <IconButton title="View">
                    <Search />
                </IconButton>
                <IconButton color="success" title="Disable">
                    <Check />
                </IconButton>
                <IconButton color="error" title="Disable">
                    <Block />
                </IconButton>
            </TableCell>
        </TableRow>
    ))

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
