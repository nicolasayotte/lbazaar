import { Box, Divider, TextField, Button, Pagination, FormControl, InputLabel, Select, MenuItem, Grid, Typography, Card } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";
import CourseContent from "../../../components/cards/CourseContent";
import User from "../../../components/cards/User";

const Details = (props) => {

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

    return (
        <Box>
            <Card sx={{mt: 2}}>
                <Grid container sx={{m: 4}}>
                    <Grid item xs={10} sm={11} md={11} lg={11}>
                        <Typography variant="h6">
                            {props.course.course_category.name}
                        </Typography>
                        <Typography variant="h4">
                            {props.course.title}
                        </Typography>
                        <Typography variant="subtitle2" sx={{p:2}}>
                            {props.course.description}
                        </Typography>
                        <Divider sx={{ my: 2 }}>Courses Contents</Divider>
                        {displayCourses(props.contents)}
                        <Divider sx={{ my: 2 }}>Teacher Information</Divider>
                        <User user={props.course.professor}/>
                        <Divider sx={{ my: 2 }}>Feedbacks</Divider>
                        {displayFeedbacks()}
                    </Grid>
                </Grid>
            </Card>
        </Box>
    )
}

export default Details;
