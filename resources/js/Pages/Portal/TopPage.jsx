import { Box, TextField, Button, Grid, Typography, Container } from "@mui/material";
import Course from "../../components/cards/Course";
import User from "../../components/cards/User";

const TopPage = (props) => {

    const displayCourses = (courses, showDescription = true) => {
        return (
            courses.map(course => {
                return <Course showDate={true} key={course.id} course={course} showDescription={showDescription}/>
            })
        )
    }

    const displayTeachers = (teachers) => {
        return (
            teachers.map(teacher => {
                return <User key={teacher.id} user={teacher}/>
            })
        )
    }

    return (
        <div>
            <Grid container justifyContent="center" alignItems="center" spacing={2} sx={{mt: 2}}>
                <Grid item xs={12} sm={12} md={6} lg={6}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Search Classes
                    </Typography>
                    <Typography variant="subtitle1" align="center" gutterBottom>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                    </Typography>
                    <Grid display="flex" justifyContent="center" sx={{ mt:2}} alignItems="center">
                        <TextField
                            required
                            fullWidth
                            placeholder="Search for classes"
                            size="small"
                        />
                        <Button sx={{ ml: 2}} variant="contained" disableElevation>
                            Search
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
            <Container maxWidth="lg" sx={{mt:2}}>
                <Typography variant="h5" gutterBottom>
                    Coming Soon
                </Typography>
                <Grid display="flex" style={{maxWidth: '100%', overflow: 'auto'}}>
                    { displayCourses(props.upcomingCourses, false) }
                </Grid>
                <Grid container spacing={2} sx={{mt:2}}>
                    <Grid item xs={12} sm={12} md={8} lg={8}>
                        <Typography variant="h5" gutterBottom>
                            Featured Classes
                        </Typography>
                        { displayCourses(props.courses) }
                        <Grid display="flex" justifyContent="center" alignItems="center">
                            <Button sx={{mt: 2}} variant="contained" disableElevation>
                                Browse Classes
                            </Button>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={4} lg={4}>
                        <Typography variant="h5" gutterBottom>
                            Featured Teachers
                        </Typography>
                        { displayTeachers(props.teachers) }
                        <Grid display="flex" justifyContent="center" alignItems="center">
                            <Button sx={{mt: 2}} variant="contained" disableElevation>
                                Browse All Teachers
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Container>
        </div>
    )
}

export default TopPage;
