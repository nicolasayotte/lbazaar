import { Link } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const UserView = () => {
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
                            <TableCell align="right" children="John Smith" />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Email" />
                            <TableCell align="right" children="johnsmith@example.com" />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Roles" />
                            <TableCell align="right" children="Student / Teacher" />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Country" />
                            <TableCell align="right" children="United States" />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Date Joined" />
                            <TableCell align="right" children="John Smith" />
                        </TableRow>
                        <TableRow>
                            <TableCell children="Status" />
                            <TableCell align="right" children="Active" />
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default UserView
