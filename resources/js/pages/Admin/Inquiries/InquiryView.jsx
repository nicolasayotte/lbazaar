
import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableRow, Typography, Link as MUILink } from "@mui/material"
import routes from '../../../helpers/routes.helper'

const InquiryView = () => {

    const { inquiry } = usePage().props

    return (
        <Box>
            <Typography
                variant="h4"
                children="View Inquiry"
                gutterBottom
            />
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs>
                    <Link href={routes["admin.inquiries.index"]} children="Inquiries" />
                    <Typography color={'text.primary'} children="Lorem Ipsum" />
                </Breadcrumbs>
            </Box>
            <Grid container>
                <Grid item xs={12} md={12}>
                    <TableContainer sx={{ mb: 4 }} component={Paper}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Name" />
                                    <TableCell align="right" children={inquiry.name} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Email" />
                                    <TableCell align="right" children={inquiry.email} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Date Sent" />
                                    <TableCell align="right" children={inquiry.created_at_string} />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Subject" />
                                    <TableCell align="right" children={inquiry.subject} />
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2}>
                                        <Typography variant="p" sx={{ mb: 2, display: 'block' }} children="Message" />
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
                                                children="Send Reply"
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

export default InquiryView
