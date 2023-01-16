import { Inertia } from "@inertiajs/inertia"
import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Button, Chip, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { useState } from "react"
import { useDispatch } from "react-redux"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import routes, { getRoute } from "../../../helpers/routes.helper"
import { actions } from "../../../store/slices/ToasterSlice"

const View = () => {

    const dispatch = useDispatch()

    const { courseApplication, messages } = usePage().props

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

    const handleOnApprove = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            text: messages.confirm.class.applications.approve,
            url: getRoute('admin.class.applications.status.update', {
                id: courseApplication.id,
                status: 'approve'
            })
        }))
    }

    const handleOnDeny = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            text: messages.confirm.class.applications.deny,
            url: getRoute('admin.class.applications.status.update', {
                id: courseApplication.id,
                status: 'deny'
            })
        }))
    }

    const handleOnDialogClose = () => {

        if (dialog.processing) {
            return
        }

        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogConfirm = () => {
        setDialog(dialog => ({
            ...dialog,
            confirmButtonText: 'Processing',
            processing: true
        }))

        Inertia.patch(dialog.url, dialog, {
            onSuccess: () => dispatch(actions.success({
                message: messages.success.class.applications.status.update
            })),
            onError: () => dispatch(actions.success({
                message: messages.error
            }))
        })
    }

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
                            <Typography color={'text.primary'} children={courseApplication.title} />
                        </Breadcrumbs>
                    </Box>
                </Grid>
                {
                    courseApplication.status === 'Pending' &&
                    <Grid item container xs={12} md={3} textAlign="right" spacing={1}>
                        <Grid item xs={12} md={6}>
                            <Button
                                children="Deny"
                                size="large"
                                variant="outlined"
                                fullWidth
                                onClick={handleOnDeny}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Button
                                children="Approve"
                                size="large"
                                variant="contained"
                                fullWidth
                                onClick={handleOnApprove}
                            />
                        </Grid>
                    </Grid>
                }
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12} lg={8} xl={9}>
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
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.title}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Type"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.type}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Category"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.category}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children="Language"/>
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.language}
                                    />
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
                                    <TableCell>
                                        <div dangerouslySetInnerHTML={{ __html: courseApplication.description }} />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid item xs={12} lg={4} xl={3}>
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
                                        <Chip label={courseApplication.status} size="small" color={statusColors[courseApplication.status]}/>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Date Applied"/>
                                    <TableCell align="right" children={courseApplication.created_at}/>
                                </TableRow>
                                {displayApprovalStatus()}
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
                                    <TableCell align="right" children={courseApplication.professor_name}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Email"/>
                                    <TableCell align="right" children={courseApplication.professor_email}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Classification"/>
                                    <TableCell align="right" children={courseApplication.professor_classification}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Member Since"/>
                                    <TableCell align="right" children={courseApplication.professor_created_at}/>
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
                                    <TableCell align="right" children={courseApplication.price}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="50%" children="Points Earned"/>
                                    <TableCell align="right" children={courseApplication.points_earned}/>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogConfirm}
            />
        </Box>
    )
}

export default View
