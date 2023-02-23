import { Box, Grid, Typography, Card, CardContent, Container, Divider, Chip, Paper, Button, CardMedia } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";
import CourseScheduleTable from "./components/CourseScheduleTable";
import { usePage } from "@inertiajs/inertia-react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { useState } from "react"
import { useDispatch } from "react-redux"
import routes, { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../../store/slices/ToasterSlice"

const Details = () => {

    const dispatch = useDispatch()
    const { auth, course, schedules, translatables } = usePage().props

    const displayFeedbacks = feedbacks => feedbacks && feedbacks.length > 0 && feedbacks.map(feedback => (
        <Feedback auth={auth} key={feedback.id} feedback={feedback}/>
    ))

    const handleClickScroll = () => {
        const schedule_table = document.getElementById('course_schedule_table');
        if (schedule_table) {
            schedule_table.scrollIntoView({ behavior: 'smooth' });
        }
      };

    const courseImage = (
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

    const BookPrice = (
        <Typography
            variant="contained"
            children={`Book for ${(course.course_type.name == 'General') ? course.price : 'Free' }`}
            size="large"
            sx={{ mb: 2 }}
        />
    )

    const checkSchedButton = (
        <Button
            fullWidth
            variant="contained"
            children={translatables.texts.check_schedules}
            size="large"
            sx={{ mb: 2 }}
            onClick={handleClickScroll}
        />
    )

    const courseTypeColors = {
        'General': 'default',
        'Earn': 'primary',
        'Free': 'success',
        'Special': 'warning'
    }

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

    return (
        <Box>
            {courseImage}
            <Container>
                <Box display={{
                    xs: 'block',
                    md: 'none'
                }}>
                    {checkSchedButton}
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Box>
                                    <Chip size="small" label={course.course_category.name} />
                                    <Chip
                                        color={courseTypeColors[course.course_type.name]}
                                        variant="outlined"
                                        size="small"
                                        label={course.course_type.name}
                                        sx={{ ml: 1 }}
                                    />
                                </Box>

                                <Typography variant="h4" children={course.title} sx={{ my: 1 }} />
                                <Typography variant="subtitle2" children={`By ${course.professor.fullname}`} />
                                <Divider sx={{ my: 2 }} />
                                <div dangerouslySetInnerHTML={{ __html: course.description }} style={{ lineHeight: 1.8 }} />
                            </CardContent>
                        </Card>
                        <CourseScheduleTable
                            id={'course_schedule_table'}
                            data={schedules}
                            handleOnCancelBook={handleCancelBooking}
                            handleOnBook={handleBook}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box display={{
                            xs: 'none',
                            md: 'block'
                        }}>
                            {BookPrice}
                            {checkSchedButton}
                        </Box>
                        <Typography variant="h6" children="Class Feedbacks" gutterBottom />
                        {displayFeedbacks(course.feedbacks)}
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
