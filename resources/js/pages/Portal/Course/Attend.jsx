import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Container, Grid, Paper, Step, StepContent, StepLabel, Stepper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { getRoute } from "../../../helpers/routes.helper"

const Attend = () => {

    const { course, schedule, active_step, booking, translatables, auth } = usePage().props



    const generateSteps = () => {
        const steps = []

        if (course.is_live) {
            steps.push({
                label: translatables.texts.live_class,
                description: translatables.texts.live_class_description,
                url: getRoute('course.attend.watch', { course_id: course.id, schedule_id: schedule.id }),
                buttonText: translatables.texts.attend_class,
                disableButton: false,
                method: 'get'
            })
        } else {
            steps.push({
                label: translatables.texts.watch_video,
                description: translatables.texts.watch_video_description,
                url: getRoute('course.attend.watch', { course_id: course.id, schedule_id: schedule.id }),
                buttonText: translatables.texts.watch_video,
                disableButton: false,
                method: 'get'
            })
        }
        let course_exams_published = course.exams.filter((exam) => exam.published_at != null)

        if (course_exams_published && course_exams_published.length > 0) {
            course_exams_published.map(exam => {
                steps.push({
                    label: exam.name,
                    description: translatables.texts.take_exam_description,
                    url: getRoute('course.attend.exams.view', { course_id: course.id, schedule_id: schedule.id, id: exam.id }),
                    buttonText: translatables.texts.take_exam,
                    disableButton: exam.published_at == null,
                    method: 'get'
                })
            })
        }

        const isFreeClass = course.course_type.type == 'Free'
        const defaultCompleteUrl = booking.completed_at ? getRoute('course.details', { id: course.id }) : getRoute('course.attend.complete', { course_id: course.id, schedule_id: schedule.id })
        const freeClassCompleteUrl = booking.completed_at ? getRoute('course.details', { id: course.id }) : getRoute('course.attend.complete.confirmation', { course_id: course.id, schedule_id: schedule.id })

        steps.push({
            label: translatables.texts.give_feedback,
            description: translatables.texts.give_feedback_description,
            url: getRoute('course.attend.feedback.create', { course_id: course.id, schedule_id: schedule.id }),
            buttonText: translatables.texts.give_feedback,
            disableButton: false,
            method: 'get'
        })

        steps.push({
            label: translatables.texts.complete_class,
            description: translatables.texts.complete_class_description,
            url: isFreeClass ? freeClassCompleteUrl : defaultCompleteUrl,
            buttonText: translatables.texts.complete,
            disableButton: false,
            method: booking.completed_at || isFreeClass ? 'get' : 'post'
        })

        return steps
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

    const Steps = () => (
        <Stepper activeStep={active_step} orientation="vertical">
            {
                generateSteps().map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel children={step.label} />
                        <StepContent>
                            <Paper sx={{ p: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={9}>
                                        <Typography variant="caption" color="GrayText" children={step.description} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Link href={step.url} as="span" method={step.method}>
                                            <Button
                                                variant="contained"
                                                children={step.buttonText}
                                                fullWidth
                                                disabled={step.disableButton}
                                            />
                                        </Link>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </StepContent>
                    </Step>
                ))
            }
        </Stepper>
    )

    const ClassInformation = () => (
        <TableContainer sx={{ mb: 2 }} component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={2} children={translatables.texts.class_information} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell children={translatables.texts.title} />
                        <TableCell align="right" children={course.title} />
                    </TableRow>
                    <TableRow>
                        <TableCell children={translatables.texts.type} />
                        <TableCell align="right" children={course.course_type.name} />
                    </TableRow>
                    {
                        course.course_type.type == 'General' || course.course_type.type == 'Free' &&
                        <TableRow>
                            <TableCell children={translatables.texts.price} />
                            <TableCell align="right" children={course.course_type.type == 'Free' ? 'Free' : course.price} />
                        </TableRow>
                    }
                    {
                        course.course_type.type == 'Earn' &&
                        <TableRow>
                            <TableCell children={translatables.texts.points_earned} />
                            <TableCell align="right" children={course.points_earned} />
                        </TableRow>
                    }
                    <TableRow>
                        <TableCell children={translatables.texts.category} />
                        <TableCell align="right" children={course.course_category.name} />
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )

    const TeacherInformation = () => (
        <TableContainer sx={{ mb: 2 }} component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell colSpan={2} children={translatables.texts.teacher_information} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell children={translatables.texts.name} />
                        <TableCell align="right" children={course.professor.fullname} />
                    </TableRow>
                    <TableRow>
                        <TableCell children={translatables.texts.date_joined} />
                        <TableCell align="right" children={course.professor.created_at} />
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )

    const BadgeInformation = () => {

        const packageCourses = course.course_package && course.course_package.courses && course.course_package.courses.length > 0
            ? course.course_package.courses.filter(item => item.id != course.id)
            : []

        const title = packageCourses.length > 0
            ? translatables.texts.complete_classes_earn_badge
            : translatables.texts.complete_class_earn_badge

        return (
            <TableContainer sx={{ mb: 2 }} component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <Typography variant="body" children={packageCourses.length > 0 ? course.course_package.name : title} />
                                {
                                    packageCourses.length > 0 &&
                                    <Typography variant="caption" children={title} color="GrayText" />
                                }
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    {
                        packageCourses.length > 0 &&
                        <TableBody>
                            {
                                packageCourses.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell children={item.title} />
                                    </TableRow>
                                ))
                            }
                        </TableBody>
                    }
                </Table>
            </TableContainer>
        )
    }

    return (
        <>
            <CourseImage />
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" children={`${translatables.texts.welcome}, ${auth.user.fullname}`} gutterBottom />
                        <Steps />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <BadgeInformation />
                        <ClassInformation />
                        <TeacherInformation />
                    </Grid>
                </Grid>
            </Container>
        </>
    )
}

export default Attend
