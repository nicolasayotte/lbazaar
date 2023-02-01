
import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Link as MUILink } from "@mui/material"
import routes from '../../../helpers/routes.helper'

const View = () => {

    const { inquiry, translatables } = usePage().props

    return (
        <Box>
            <Typography
                variant="h4"
                children={translatables.title.inquiries.view}
                gutterBottom
            />
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs>
                    <Link href={routes["admin.inquiries.index"]} children={translatables.title.inquiries.index} />
                    <Typography color={'text.primary'} children={inquiry.subject} />
                </Breadcrumbs>
            </Box>
            <Grid container>
                <Grid item xs={12} md={12}>
                    <TableContainer sx={{ mb: 4 }} component={Paper}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="20%" children={translatables.texts.name} />
                                    <TableCell children={inquiry.name} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.email} />
                                    <TableCell children={inquiry.email} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.date} />
                                    <TableCell children={inquiry.created_at_string} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.subject} />
                                    <TableCell children={inquiry.subject} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.message} />
                                    <TableCell>
                                        <Typography variant="p" children={inquiry.message} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} align="right">
                                        <Button variant="contained">
                                            <MUILink
                                                href={`mailto:${inquiry.email}?subject=${inquiry.subject}`}
                                                color="inherit"
                                                underline="none"
                                                target="__blank"
                                                children={translatables.texts.send_reply}
                                            />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Box>
    )
}

export default View
