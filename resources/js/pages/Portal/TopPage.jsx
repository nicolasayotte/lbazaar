import { Box, Divider, TextField, Button, Grid, Typography, Container } from "@mui/material";
import Course from "../../components/cards/Course";
import User from "../../components/cards/User";
import { Link, useForm, usePage } from "@inertiajs/inertia-react";
import routes from "../../helpers/routes.helper";
import { handleOnChange } from "../../helpers/form.helper"

const TopPage = () => {

    const { courses, teachers, upcomingCourses } = usePage().props

    const { data, setData, get } = useForm({
        search_text: ''
    })

    const handleFormSubmit = e => {
        e.preventDefault()

        get(routes["course.index"])
    }

    const displayCourses = (courses, showDescription = true, detailId = 'id', imagePosition = 'left') => courses && courses.length > 0 && courses.map(course => (
        <Course
            key={course.id}
            course={course}
            showDate={true}
            viewDetailId={detailId}
            showDescription={showDescription}
            imagePosition={imagePosition}
        />
    ))

    const displayTeachers = teachers => teachers && teachers.length > 0 && teachers.map(teacher => (
        <User key={teacher.id} user={teacher}/>
    ))

    const header = (
        <>
            <Box
                sx={{
                    width: '100%',
                    minHeight: {
                        xs: "350px",
                        md: "350px"
                    },
                    backgroundImage: "url(https://i.picsum.photos/id/4/5000/3333.jpg?hmac=ghf06FdmgiD0-G4c9DdNM8RnBIN7BO0-ZGEw47khHP4)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    mb: 4
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#333",
                        opacity: 0.5
                    }}
                />
                <Box sx={{ position: 'relative', zIndex: 500 }}>
                    <Container >
                        <Box sx={{ color: "white" }}>
                            <Typography variant="h4" align="center" gutterBottom children="Welcome to LE Bazaar" />
                            <Typography variant="subtitle1" align="center" gutterBottom>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</Typography>
                        </Box>
                        <form onSubmit={handleFormSubmit}>
                            <Grid
                                container
                                spacing={1}
                                sx={{
                                    maxWidth: {
                                        xs: "100%",
                                        md: "60%"
                                    },
                                    marginX: 'auto',
                                    mt: 3
                                }}
                            >
                                <Grid item xs={8} md={10}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        placeholder="Search for class name"
                                        inputProps={{
                                            style: {
                                                backgroundColor: 'white',
                                                borderRadius: 5
                                            }
                                        }}
                                        name="search_text"
                                        value={data.keyword}
                                        onChange={e => handleOnChange(e, setData)}
                                    />
                                </Grid>
                                <Grid item xs={4} md={2}>
                                    <Button
                                        type="submit"
                                        onClick={handleFormSubmit}
                                        children="Search"
                                        variant="contained"
                                        sx={{ height: '100%' }}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </form>
                    </Container>
                </Box>
            </Box>
        </>
    )

    return (
        <Box>
            {header}
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" gutterBottom children="Featured Classes" />
                        { displayCourses(courses) }
                        <Box textAlign="center">
                            <Link href={routes["course.index"]}>
                                <Button sx={{mt: 2, mb: 2}} variant="contained" disableElevation>
                                    Browse Classes
                                </Button>
                            </Link>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" gutterBottom children="Coming Soon" />
                        { displayCourses(upcomingCourses, false, 'course_id', 'top') }
                        <Typography variant="h5" gutterBottom children="Featured Teachers" />
                        { displayTeachers(teachers) }
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default TopPage;
