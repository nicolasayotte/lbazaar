import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Box, Slider, Button, Card, CardContent, Container, Divider, Grid, Stack, Typography, Avatar, Tooltip } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import { getRoute } from "../../helpers/routes.helper"
import Input from "../../components/forms/Input"
import { handleOnChange, handleEditorOnChange } from "../../helpers/form.helper";
import TextEditorInput from "../../components/forms/TextEditorInput"
import BackButton from "../../components/common/BackButton"
import { Email, CalendarMonth } from "@mui/icons-material"
import { useState } from "react"
import { Inertia } from "@inertiajs/inertia"
import FormDialog from "../../components/common/FormDialog"
import routes from "../../helpers/routes.helper"

const CourseCompleteConfirmation = () => {

    const dispatch = useDispatch()

    const { translatables, course, schedule, auth, errors } = usePage().props;

    const {post, processing, } = useForm({

    })

    const handleSubmit = (e) => {
        e.preventDefault()

        post(getRoute('course.attend.complete', { course_id: course.id, schedule_id: schedule.id }), {
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        });
    }

    const marks = [
        {
            value: 0,
            label: '0',
        },
        {
            value: 100,
            label: '100',
        }
    ];

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        points: 0,
        schedule_id: schedule.id,
        submitUrl: '',
        method: null,
        processing: false,
        type: '',
    })

    const handleOnDonatePoints = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.donate_points,
            submitUrl: routes["course.send.donation"],
            method: 'post',
            action: 'donate'
        }))
    }

    const dialogForm = () => {

        return (
            <Box mt={1}>
                <Input
                    label={translatables.texts.points}
                    type="number"
                    name="points"
                    value={dialog.points}
                    onChange={e => setDialog(dialog => ({ ...dialog, points: e.target.value }))}
                />
            </Box>
        )
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = e => {
        e.preventDefault()

        Inertia.visit(dialog.submitUrl, {
            method: dialog.method,
            data: {
                points: dialog.points,
                schedule_id: dialog.schedule_id,
            }
        })
    }

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                            <Typography variant="h5" align="center">{translatables.texts.complete_class} {course.title}?</Typography>
                            <Grid item xs={12} md={11} mx="auto" py={4}>
                                <Grid container alignItems="center" spacing={{ xs: 2, md: 5 }}>
                                    <Grid item xs={12} md={4}>
                                        <Avatar
                                            src={course.professor.image}
                                            variant="circular"
                                            sx={{
                                                width: 100,
                                                height: 100,
                                                maxWidth: '100%',
                                                mx: 'auto'
                                            }}
                                        />
                                        <Box textAlign="center" my={2}>
                                            { course.professor.fullname }
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        { course.professor.specialty }
                                        <Divider sx={{ my: 2 }}/>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Tooltip title="Date Joined" arrow>
                                                <CalendarMonth/>
                                            </Tooltip>
                                            { course.professor.created_at }
                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Tooltip title="Email" arrow>
                                                <Email/>
                                            </Tooltip>
                                            { course.professor.email }
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle1" align="center">"{translatables.texts.complete_class_confirmation_message}"</Typography>

                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>

                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={1} justifyContent="end">
                                        <Link href={getRoute('course.attend.index', { course_id: course.id, schedule_id: schedule.id })} >
                                            <Button
                                                variant="outlined"
                                                children={translatables.texts.back}

                                            />
                                        </Link>
                                            <Button
                                                onClick={handleOnDonatePoints}
                                                variant="contained"
                                                disabled={processing}
                                            >{translatables.texts.donate_points}</Button>
                                            <Button
                                                onClick={handleSubmit}
                                                variant="contained"
                                                disabled={processing}
                                            >{translatables.texts.complete}</Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            <FormDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleSubmit={handleOnDialogSubmit}
                children={dialogForm()}
                disableSubmit={
                   (dialog.points <= 0 || dialog.points.length <= 0 || dialog.points > auth.user.user_wallet.points)
                }
            />
        </Box>
    )
}

export default CourseCompleteConfirmation
