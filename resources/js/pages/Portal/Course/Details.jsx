import { Box, Grid, Typography, Card, CardContent, Container, Divider, Chip, Paper, CircularProgress, Stack, Button } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";
import { usePage } from "@inertiajs/inertia-react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../../store/slices/ToasterSlice"
import CourseScheduleList from "./components/CourseScheduleList";
import { grey } from "@mui/material/colors";
import Course from "../../../components/cards/Course";
import TeacherInfo from "../../../components/cards/TeacherInfo"

const Details = () => {

    const dispatch = useDispatch()

    const { auth, course, schedules, feedbacks, translatables, feedbackCount, feedbacksPerPage } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        value: '',
        submitUrl: '',
        method: null,
        processing: false,
        type: ''
    })

    const handleBook = schedule_id => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.book,
            text: translatables.confirm.class.schedules.book,
            submitUrl: getRoute('course.book', {schedule_id}),
            method: 'post',
            action: 'booked'
        }))
    }

    const handleCancelBooking = schedule_id => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.cancel,
            text: translatables.confirm.class.schedules.cancel,
            submitUrl: getRoute('course.cancel', {schedule_id}),
            method: 'post',
            action: 'cancelled'
        }))
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
            errorBag: dialog.action,
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.class.booking[dialog.action]
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    const handleOnFeedbacksLoad = () => {
        Inertia.visit(getRoute('course.details', { id: course.id }), {
            data: {feedback_count: parseInt(feedbackCount) + parseInt(feedbacksPerPage)},
            only: [
                'feedbacks',
                'feedbackCount'
            ],
            preserveScroll: true
        })
    }

    const Feedbacks = () => {

        const CourseFeedbacks = () => feedbacks && feedbacks.length > 0 && feedbacks.map(feedback => (
            <Feedback
                key={feedback.id}
                showUser={auth && auth.user && auth.user.id == course.professor_id}
                feedback={feedback}
            />
        ))

        return (
            <>
                <CourseFeedbacks />
                {
                    feedbacks.length < course.feedbacks.length &&
                    <Box textAlign="center">
                        <Button
                            variant="outlined"
                            children={translatables.texts.load_more}
                            onClick={handleOnFeedbacksLoad}
                        />
                    </Box>
                }
            </>
        )
    }

    const CourseImage = () => (
        <Box sx={{ backgroundColor: '#333', width: '100%' }}>
            <Container>
                <Box
                    sx={{
                        minHeight: {
                            xs: '250px',
                            md: '400px'
                        },
                        width: '100%',
                        backgroundImage: `url(${course.image_thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        mb: 2
                    }}
                />
            </Container>
        </Box>
    )

    const Rating = () => {
        return (
            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box position="relative" display="inline-flex">
                        <CircularProgress
                            variant="determinate"
                            value={course.overall_rating}
                            size={80}
                            thickness={5}
                            sx={{
                                position: 'relative',
                                zIndex: 2
                            }}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `9px solid ${grey['300']}`,
                                borderRadius: '100%',
                                zIndex: 1
                            }}
                        >
                            <Typography variant="h5" component="div" color="text.secondary" children={Math.round(course.overall_rating)} />
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h5" textAlign="center" children={translatables.texts.overall_rating} />
                        <Typography
                            variant="caption"
                            display="block"
                            color="GrayText"
                            children={`${course.feedbacks.length} ${translatables.title.feedbacks.toLowerCase()}`}
                        />
                    </Box>
                </Stack>
            </Paper>
        )
    }

    const ClassInformation = () => {

        const classInfos = [
            { type: translatables.texts.type, value: course.course_type.type },
            { type: translatables.texts.format, value: course.format }
        ]

        const dynamicInfos = {
            'General': { type: translatables.texts.price, value: course.price },
            'Free': { type: translatables.texts.price, value: 'Free' },
            'Earn': { type: translatables.texts.points_earned, value: course.points_earned }
        }

        classInfos.push(dynamicInfos[course.course_type.type])

        return (
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {
                    classInfos.map((info, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper sx={{ p: 2 }}>
                                <Typography
                                    variant="button"
                                    textAlign="center"
                                    display="block"
                                    children={info.value}
                                />
                                <Typography
                                    variant="caption"
                                    textAlign="center"
                                    display="block"
                                    color="GrayText"
                                    children={info.type}
                                />
                            </Paper>
                        </Grid>
                    ))
                }
            </Grid>
        )
    }

    const PackageInformation = () => {

        const packageCourses = course.course_package && course.course_package.courses && course.course_package.courses.length > 0
                               ? course.course_package.courses.filter(packageCourse => packageCourse.id != course.id)
                               : []

        const PackageCourses = () => packageCourses.map(packageCourse => <Course key={packageCourse.id} course={packageCourse} />)

        return packageCourses.length > 0 && (
            <>
                <Typography variant="h5" children={course.course_package && course.course_package.name} />
                <Typography variant="caption" color="GrayText" children={translatables.texts.complete_classes_earn_badge} />
                <PackageCourses />
            </>
        )
    }

    return (
        <Box>
            <CourseImage />
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <ClassInformation />
                        <TeacherInfo user={course.professor}/>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h4" children={course.title} sx={{ my: 1 }} />
                                <Typography variant="subtitle2" children={`By ${course.professor.fullname}`} />
                                <Divider sx={{ my: 2 }} />
                                <div dangerouslySetInnerHTML={{ __html: course.description }} style={{ lineHeight: 1.8 }} />
                            </CardContent>
                        </Card>
                        <CourseScheduleList data={schedules} handleOnBook={handleBook} handleOnCancelBook={handleCancelBooking} />
                        <PackageInformation />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Rating />
                        <Feedbacks />
                    </Grid>
                </Grid>
            </Container>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogSubmit}
            />
        </Box>
    )
}

export default Details;
