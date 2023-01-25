import { Box, Grid, Typography, Card, CardContent, Container, Divider, Chip, Paper } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";
import CourseContent from "../../../components/cards/CourseContent";
import { usePage } from "@inertiajs/inertia-react"


const Details = () => {

    const { auth, course, contents } = usePage().props

    const displayCourseContents = courseContents => courseContents && courseContents.length > 0 && courseContents.map(course => (
        <CourseContent
            showDate={true}
            key={course.id}
            course={course}
            viewDetailId="id"
            showDescription={true}
        />
    ))

    const displayFeedbacks = feedbacks => feedbacks && feedbacks.length > 0 && feedbacks.map(feedback => (
        <Feedback auth={auth} key={feedback.id} feedback={feedback}/>
    ))

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

    const courseTypeColors = {
        'General': 'default',
        'Earn': 'primary',
        'Free': 'success',
        'Special': 'warning'
    }

    return (
        <Box>
            {courseImage}
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={ course && course.feedbacks && course.feedbacks.length > 0 ? 8 : 12 }>
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
                        {displayCourseContents(contents)}
                    </Grid>
                    <Grid item xs={12} md={4}>
                        {displayFeedbacks(course.feedbacks)}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default Details;
