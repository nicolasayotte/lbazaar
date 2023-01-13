import { Link } from "@inertiajs/inertia-react"
import { Block, Check } from "@mui/icons-material"
import { Box, Breadcrumbs, Button, Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const View = () => {
    return (
        <Box>
            <Grid container spacing={2} justifyContent="space-between" alignItems="center" mb={2}>
                <Grid item xs={12} md={9}>
                    <Typography
                        variant="h4"
                        children="Class Application Details"
                        gutterBottom
                    />
                    <Box>
                        <Breadcrumbs>
                            <Link href={routes["admin.class.applications.index"]} children="Class Applications" />
                            <Typography color={'text.primary'} children="Class Application Detail" />
                        </Breadcrumbs>
                    </Box>
                </Grid>
                <Grid item container xs={12} md={3} textAlign="right" spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Button
                            children="Deny"
                            color="error"
                            size="large"
                            variant="outlined"
                            fullWidth
                            sx={{ mr: 2 }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Button
                            children="Approve"
                            color="success"
                            size="large"
                            variant="contained"
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12} md={8} xl={9}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="General Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="10%" children="Title"/>
                                    <TableCell children="Lorem Ipsum" sx={{ textAlign: { xs: "right", md: "left" } }}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Type"/>
                                    <TableCell children="General" sx={{ textAlign: { xs: "right", md: "left" } }}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Category"/>
                                    <TableCell children="Web Development" sx={{ textAlign: { xs: "right", md: "left" } }}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Language"/>
                                    <TableCell children="English" sx={{ textAlign: { xs: "right", md: "left" } }}/>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell children="Content Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Lorem Ipsum Dolor Sit Amet" />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} md={4} xl={3}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="Status Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Status"/>
                                    <TableCell align="right">
                                        <Chip label="Pending" size="small"/>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Date Applied"/>
                                    <TableCell align="right" children="2022-01-01"/>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="Teacher Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Name"/>
                                    <TableCell align="right" children="John Smith" />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Email"/>
                                    <TableCell align="right" children="johnsmith@example.com"/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Classification"/>
                                    <TableCell align="right" children="A"/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Member Since"/>
                                    <TableCell align="right" children="2022-10-10"/>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="Pricing Information"/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="50%" children="Price"/>
                                    <TableCell align="right" children="10.00" />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="50%" children="Points Earned"/>
                                    <TableCell align="right" children="10.00"/>
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
