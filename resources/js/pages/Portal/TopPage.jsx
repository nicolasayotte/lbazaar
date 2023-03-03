import { Box, Divider, TextField, Button, Grid, Typography, Container } from "@mui/material";
import Course from "../../components/cards/Course";
import User from "../../components/cards/User";
import { Link, useForm, usePage } from "@inertiajs/inertia-react";
import routes from "../../helpers/routes.helper";
import { handleOnChange } from "../../helpers/form.helper"
import Header from "../../components/common/Header";

const TopPage = () => {

    const { courses, teachers, upcomingCourses, translatables } = usePage().props

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
            course={course && course.course ? course.course : course}
            schedule={course && course.simple_start_datetime}
            viewDetailId={detailId}
            showDescription={showDescription}
            imagePosition={imagePosition}
        />
    ))

    const displayTeachers = teachers => teachers && teachers.length > 0 && teachers.map(teacher => (
        <User key={teacher.id} user={teacher}/>
    ))

    return (
        <Box>
            <Header minHeight="350px">
                <Container>
                    <Box sx={{ color: "white" }}>
                        <Typography variant="h4" align="center" gutterBottom children="Welcome to LE Bazaar" />
                        <Typography variant="subtitle1" align="center" gutterBottom>{ translatables.top_page.description }</Typography>
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
                                    placeholder={translatables.texts.search_class_name}
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
                                    children={translatables.texts.search}
                                    variant="contained"
                                    sx={{ height: '100%' }}
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </form>
                </Container>
            </Header>
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h5" gutterBottom children={translatables.texts.featured_classes} />
                        { displayCourses(courses) }
                        <Box textAlign="center">
                            <Link href={routes["course.index"]}>
                                <Button sx={{mt: 2, mb: 2}} variant="contained" disableElevation>
                                   { translatables.texts.browse_classes }
                                </Button>
                            </Link>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" gutterBottom children={translatables.texts.coming_soon} />
                        { displayCourses(upcomingCourses, false, 'id', 'top') }
                        <Typography variant="h5" gutterBottom children={translatables.texts.featured_teachers} />
                        { displayTeachers(teachers) }
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default TopPage;
