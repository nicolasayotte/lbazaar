import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Button, Chip, Grid, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { useState } from "react"
import { useDispatch } from "react-redux"
import BackButton from "../../../../components/common/BackButton"
import routes from "../../../../helpers/routes.helper"

const View = () => {

    const dispatch = useDispatch()

    const { courseApplication, translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: 'Class Application',
        text: '',
        url: '',
        confirmButtonText: 'Confirm',
        processing: false
    })

    const generalInformationStyle = {
        textAlign: {
            xs: "right",
            md: "left"
        }
    }

    const statusColors = {
        "Approved": 'success',
        "Pending": 'default',
        "Denied": 'error'
    }

    const displayApprovalStatus = () => {

        if (courseApplication.status === 'Pending') return ""

        return (
            <TableRow>
                <TableCell children={`Date ${courseApplication.status}`}/>
                <TableCell
                    align="right"
                    children={
                        courseApplication.status === 'Approved'
                        ? courseApplication.approved_at
                        : courseApplication.denied_at
                    }
                />
            </TableRow>
        )
    }

    return (
        <Box>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md="auto">
                    <Typography variant="h4" children={translatables.title.class.applications.view} />
                    <Breadcrumbs>
                        <Link href={routes["mypage.course.applications.index"]} children={translatables.title.class.applications.index} />
                        <Typography color="text.primary" children={translatables.title.class.applications.view} />
                    </Breadcrumbs>
                </Grid>
                <Grid item xs={12} md={2}>
                    <Link href={routes["mypage.course.applications.index"]} style={{ width: '100%' }}>
                        <Button
                            fullWidth
                            children={translatables.texts.back}
                            variant="contained"
                        />
                    </Link>
                </Grid>
                <Grid item xs={12} md={8}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children={translatables.texts.general_information}/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="10%" children={translatables.texts.title}/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.title}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children={translatables.texts.type}/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.type}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children={translatables.texts.category}/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.category}
                                    />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell children={translatables.texts.content_information}/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>
                                        <div dangerouslySetInnerHTML={{ __html: courseApplication.description }} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children={translatables.texts.status_information}/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children={translatables.texts.status}/>
                                    <TableCell align="right">
                                        <Chip label={courseApplication.status} size="small" color={statusColors[courseApplication.status]}/>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.date_applied}/>
                                    <TableCell align="right" children={courseApplication.created_at}/>
                                </TableRow>
                                {displayApprovalStatus()}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children={translatables.texts.pricing_information}/>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="50%" children={translatables.texts.price}/>
                                    <TableCell align="right" children={courseApplication.price}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="50%" children={translatables.texts.points_earned}/>
                                    <TableCell align="right" children={courseApplication.points_earned}/>
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
