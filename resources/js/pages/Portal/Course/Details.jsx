import { Box, Grid, Link, Button, Typography, Card, CardContent } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";
import { InsertComment } from "@mui/icons-material"
import CourseContent from "../../../components/cards/CourseContent";
import User from "../../../components/cards/User";
import DividerSection from "../../../components/common/DividerSection"
import { usePage } from "@inertiajs/inertia-react"
import { getRoute } from "../../../helpers/routes.helper"

const Details = (props) => {

    const { auth } = usePage().props

    const displayCourses = (courses, showDescription = true) => {
        if (courses.length > 0) {
            return (
                <div>
                    {courses.map(course => {
                        return <CourseContent showDate={true} key={course.id} course={course} viewDetailId="id" showDescription={showDescription}/>
                    })}
                </div>
            )
        } else {
            return (
                <Typography variant="subtitle1" sx={{mt: 3}} align="center">
                    No Content yet.
                </Typography>
            )
        }
    }

    const displayFeedbacks = () => {
        return (
            props.course.feedbacks.map(feedback => {
                return <Feedback key={feedback.id} feedback={feedback}/>
            })
        )
    }

     const displayButtonFeedback = () => {
        if (props.isBooked) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Link href={getRoute('course.feedback.index', {id : props.course.id}, {returnUrl : getRoute('course.details', {id : props.course.id})})}>
                        <Button
                            variant="contained"
                            children={!props.hasFeedback ? "Give Feedback" : "Edit Feedback"}
                            startIcon={
                                <InsertComment />
                            }
                        />
                    </Link>
                </Box>
            )
        }
    }

    return (
        <Box>
            <Grid container sx={{m: 4}}>
                <Grid item xs={10} sm={11} md={11} lg={11}>
                    <Grid item sx={{p:2}}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">
                                    {props.course.course_category.name}
                                </Typography>
                                <Typography variant="h4">
                                    {props.course.title}
                                </Typography>
                                    <Typography variant="subtitle1">
                                        {`Lectured by ${props.course.professor.fullname}`}
                                    </Typography>
                                <Typography variant="subtitle2" sx={{p:2}}>
                                    {props.course.description}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <DividerSection title="Course Content"/>
                    {displayCourses(props.contents)}
                    <DividerSection title="Feedbacks"/>
                    {displayFeedbacks()}
                    {displayButtonFeedback()}
                </Grid>
            </Grid>
        </Box>
    )
}

export default Details;
