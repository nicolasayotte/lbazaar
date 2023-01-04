import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const UserView = () => {

    const { user } = usePage().props

    return (
        <Box>
            <Typography
                variant="h4"
                children="User"
                gutterBottom
            />
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs>
                    <Link href={routes["admin.users.index"]} children="Manage Users" />
                    <Typography color={'text.primary'} children="User" />
                </Breadcrumbs>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell children="Name" />
                            <TableCell align="right" children={user.name} />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Email" />
                            <TableCell align="right" children={user.email} />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Roles" />
                            <TableCell align="right" children={user.roles.join(' / ')} />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Country" />
                            <TableCell align="right" children={user.country} />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Date Joined" />
                            <TableCell align="right" children={user.date_joined} />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Status" />
                            <TableCell align="right" children={user.status} />
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default UserView
