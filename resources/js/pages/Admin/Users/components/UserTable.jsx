import { Link } from "@inertiajs/inertia-react"
import { Block, Check, Search } from "@mui/icons-material"
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const UserTable = ({ data, handleOnEnable, handleOnDisable }) => {

    const enableButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title="Enable"
            disabled={isDisabled}
            onClick={() => handleOnEnable(id)}
        >
            <Check fontSize="inherit" color={isDisabled ? 'inherit' : 'success'}/>
        </IconButton>
    )

    const disableButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title="Disabled"
            disabled={isDisabled}
            onClick={() => handleOnDisable(id)}
        >
            <Block fontSize="inherit" color={isDisabled ? 'inherit' : 'error'} />
        </IconButton>
    )

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.email}/>
            <TableCell children={row.roles.join(', ')} align="center"/>
            <TableCell children={row.status} align="center"/>
            <TableCell children={row.date_joined} align="center"/>
            <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Link href={getRoute('admin.users.view', { id: row.id })}>
                        <IconButton size="small" title="View">
                            <Search fontSize="inherit" />
                        </IconButton>
                    </Link>
                    {enableButton(row.id, row.is_active)}
                    {disableButton(row.id, !row.is_active)}
                </Box>
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
