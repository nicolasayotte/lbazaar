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

    const { courseApplication, translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.class.applications.view,
        text: '',
        url: '',
        confirmButtonText: translatables.texts.confirm,
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
                <TableCell children={translatables.texts[`date_${courseApplication.status.toLowerCase()}`]}/>
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
            text: translatables.confirm.class.applications.approve,
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
            text: translatables.confirm.class.applications.deny,
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
            confirmButtonText: translatables.texts.processing,
            processing: true
        }))

        Inertia.patch(dialog.url, dialog, {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.class.applications.status.update
            })),
            onError: () => dispatch(actions.success({
                message: translatables.error
            }))
        })
    }

    return (
        <Box>
            <Grid container spacing={2} justifyContent="space-between" alignItems="center" mb={2}>
                <Grid item xs={12} md={9}>
                    <Typography
                        variant="h4"
                        children={translatables.title.class.applications.view}
                        gutterBottom
                    />
                    <Box>
                        <Breadcrumbs>
                            <Link href={routes["admin.class.applications.index"]} children={translatables.title.class.applications.index} />
                            <Typography color={'text.primary'} children={courseApplication.title} />
                        </Breadcrumbs>
                    </Box>
                </Grid>
                {
                    courseApplication.status === 'Pending' &&
                    <Grid item container xs={12} md={3} textAlign="right" spacing={1}>
                        <Grid item xs={12} md={6}>
                            <Button
                                children={translatables.texts.deny}
                                size="large"
                                variant="outlined"
                                fullWidth
                                onClick={handleOnDeny}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Button
                                children={translatables.texts.approve}
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
                                    <TableCell colSpan={2} children={translatables.texts.general_information} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="10%" children={translatables.texts.title} />
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.title}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children={translatables.texts.type} />
                                    <TableCell
                                        sx={generalInformationStyle}
                                        children={courseApplication.type}
                                    />
                                </TableRow>
                                <TableRow>
                                    <TableCell width="10%" children={translatables.texts.category} />
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
                                    <TableCell children={translatables.texts.content_information} />
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
                                    <TableCell colSpan={2} children={translatables.texts.status_information} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children={translatables.texts.status} />
                                    <TableCell align="right">
                                        <Chip label={courseApplication.status} size="small" color={statusColors[courseApplication.status]}/>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.date_applied} />
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
                                    <TableCell colSpan={2} children={translatables.texts.teacher_information} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children={translatables.texts.name} />
                                    <TableCell align="right" children={courseApplication.professor_name}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.email} />
                                    <TableCell align="right" children={courseApplication.professor_email}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell children={translatables.texts.date_joined} />
                                    <TableCell align="right" children={courseApplication.professor_created_at}/>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children={translatables.texts.pricing_information} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell width="50%" children={translatables.texts.price} />
                                    <TableCell align="right" children={courseApplication.price}/>
                                </TableRow>
                                <TableRow>
                                    <TableCell width="50%" children={translatables.texts.points_earned} />
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
