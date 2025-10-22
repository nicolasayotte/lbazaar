import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const View = () => {

    const { user, translatables } = usePage().props

    return (
        <Box>
            <Typography
                variant="h4"
                children={translatables.title.users.view}
                gutterBottom
            />
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs>
                    <Link href={routes["admin.users.index"]} children={translatables.title.users.index} />
                    <Typography color={'text.primary'} children={translatables.title.users.view} />
                </Breadcrumbs>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{ width: { xs: '30%', md: '20%' } }} children={translatables.texts.name} />
                            <TableCell children={user.name} />
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: { xs: '30%', md: '20%' } }} children={translatables.texts.email} />
                            <TableCell children={user.email} />
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: { xs: '30%', md: '20%' } }} children={translatables.texts.role} />
                            <TableCell children={user.roles.join(' / ')} />
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: { xs: '30%', md: '20%' } }} children={translatables.texts.country} />
                            <TableCell children={user.country} />
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: { xs: '30%', md: '20%' } }} children={translatables.texts.date_joined} />
                            <TableCell children={user.date_joined} />
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ width: { xs: '30%', md: '20%' } }} children={translatables.texts.status} />
                            <TableCell children={user.status} />
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default View
