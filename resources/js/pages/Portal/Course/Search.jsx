import { Box, TextField, Button, Pagination, Skeleton, Stack, InputLabel, Select, MenuItem, Grid, Typography, Container, Card, CardContent } from "@mui/material";
import { useForm } from '@inertiajs/inertia-react'
import { actions } from '../../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import Course from "../../../components/cards/Course";
import Input from "../../../components/forms/Input";
import { displaySelectOptions } from "../../../helpers/form.helper";
import routes from "../../../helpers/routes.helper"

const SearchCourse = ({courses, course_types, course_categories, teachers, languages, messages }) => {

    const dispatch = useDispatch()

    const FIRST_PAGE = 1

    const getCurrentDate = () => {
        const today = new Date()

        let year  = today.getFullYear().toString(),
            month = (today.getMonth() + 1).toString(),
            day   = today.getDate().toString()

            month = month.padStart(2, '0')
            day = day.padStart(2, '0')

        return [year, month, day].join('-')
    }

    const { data, setData, get, errors, processing, reset, clearErrors } = useForm({
        search_text: '',
        type_id: '',
        category_id: '',
        language: '',
        professor_id: '',
        month: getCurrentDate().slice(0, 7),
        page: courses.current_page,
    })

    const handleSubmit = () => {
        get(routes['course.index'], {
            preserveState: true,
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        });
    }

    const handleReset = () => {
        reset()
    }

    const setPageToOne = () => {
        data.page = FIRST_PAGE
        handleSubmit()
    }

    const handlePageChange = (e, page) => {
        data.page = page
        handleSubmit()
    }

    const displayCourses = (courses, showDescription = true) => {
        if (courses.data.length > 0) {
            return (
                <>
                    {courses.data.map(course => {
                        return <Course showDate={true} key={course.id} course={course} viewDetailId="id" showDescription={showDescription}/>
                    })}
                    <Grid display="flex" justifyContent="center" alignItems="center">
                        <Pagination sx={{mt: 2, justifyContent: 'center'}} onChange={handlePageChange} page={data.page} count={courses.last_page} color="primary" />
                    </Grid>
                </>
            )
        } else {
            return (
                <Typography variant="subtitle1" sx={{mt: 3}} align="center">
                    No record found.
                </Typography>
            )
        }
    }

    const displayProcessing = () => {
        return (
               <Stack spacing={1} sx={{p:2}}>
                    <Skeleton animation="wave" variant="rounded" width='100%' height={200}/>
                    <Skeleton animation="wave" variant="rounded" width='100%' height={200}/>
               </Stack>
        )
    }

    const handleOnChange = e => {
        setData(e.target.name, e.target.value)
    }

    return (
        <Box>
            <Grid container sx={{m: 4}}>
                <Grid item xs={10} sm={3} md={3} lg={3}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Browse Classes
                    </Typography>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Filter
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={12}>
                                    <Input
                                        placeholder="Search for classes"
                                        name="search_text"
                                        value={data.search_text}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    />
                                </Grid>
                                <Grid item  xs={12} sm={12}>
                                    <Input
                                        label="Type"
                                        select
                                        name="type_id"
                                        value={data.type_id}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    >
                                        <option value=""></option>
                                        {displaySelectOptions(course_types)}
                                    </Input>
                                </Grid>
                                <Grid item xs={12} sm={12}>
                                    <Input
                                        label="Category"
                                        select
                                        name="category_id"
                                        value={data.category_id}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    >
                                        <option value=""></option>
                                        {displaySelectOptions(course_categories)}
                                    </Input>
                                </Grid>
                                <Grid item xs={12} sm={12}>
                                    <Input
                                        label="Teachers"
                                        select
                                        name="professor_id"
                                        value={data.professor_id}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    >
                                        <option value=""></option>
                                        {displaySelectOptions(teachers, 'id', 'fullname')}
                                    </Input>
                                </Grid>
                                <Grid item xs={12} sm={12}>
                                    <Input
                                        label="Languages"
                                        select
                                        name="language"
                                        value={data.language}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    >
                                        <option value=""></option>
                                        {displaySelectOptions(languages, 'language', 'language')}
                                    </Input>
                                </Grid>
                                <Grid item xs={12} sm={12}>
                                    <Input
                                        type="month"
                                        name="month"
                                        value={data.month}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={12}>
                                    <Grid display="flex" justifyContent="center" alignItems="center">
                                        <Button sx={{ mt: 2}}
                                            onClick={setPageToOne}
                                            variant="contained"
                                            disabled={processing}
                                            disableElevation>
                                            Filter
                                        </Button>
                                        <Button sx={{ mt: 2, ml: 2}}
                                            onClick={handleReset}
                                            variant="outlined"
                                            disableElevation>
                                            Reset
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={10} sm={8} md={8} lg={8} sx={{mt:5}}>
                    {processing ? displayProcessing() : displayCourses(courses)}
                </Grid>
            </Grid>
        </Box>
    )
}

export default SearchCourse;
