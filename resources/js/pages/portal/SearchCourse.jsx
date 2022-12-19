import { Box, TextField, Button, Pagination, Skeleton, Stack, InputLabel, Select, MenuItem, Grid, Typography, Container, Card, CardContent } from "@mui/material";
import SelectInput from '../../components/forms/SelectInput';
import YearMonthPicker from '../../components/forms/YearMonthPicker';
import { useForm } from '@inertiajs/inertia-react'
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import ErrorText from '../../components/common/ErrorText'
import Course from "../../components/cards/Course";
import Input from "../../components/forms/Input";
import { displaySelectOptions } from "../../components/helpers/form.helper";

const SearchCourse = (props) => {

    const dispatch = useDispatch()

    const FIRST_PAGE = 1

    const getCurrentDate = () => {
        const today = new Date()

        let year  = today.getFullYear().toString(),
            month = (today.getMonth() + 1).toString(),
            day   = today.getDate().toString()

        month.padStart(2, '0')
        day.padStart(2, '0')

        return [year, month, day].join('-')
    }

    const { data, setData, get, errors, processing, reset, clearErrors } = useForm({
        search_text: '',
        type_id: '',
        category_id: '',
        language: '',
        professor_id: '',
        month: getCurrentDate().slice(0, 7),
        page: props.courses.current_page,
    })

    const handleSubmit = () => {
        get('/courses', {
            preserveState: true,
            onError: (response) => {
                dispatch(actions.toggle({
                    open: true,
                    type: 'error',
                    message: 'There was an error encountered'
                }))
            }
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
                <div>
                    {courses.data.map(course => {
                        return <Course showDate={true} key={course.id} course={course} viewDetailId="course_id" showDescription={showDescription}/>
                    })}
                    <Grid display="flex" justifyContent="center" alignItems="center">
                        <Pagination sx={{mt: 2, justifyContent: 'center'}} onChange={handlePageChange} page={data.page} count={props.courses.last_page} color="primary" />
                    </Grid>
                </div>
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
                    <Card>
                        <CardContent>
                            {data.category_id}
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
                                            {displaySelectOptions(props.course_types)}
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
                                            {displaySelectOptions(props.course_categories)}
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
                                            {displaySelectOptions(props.teachers, 'id', 'fullname')}
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
                                            {displaySelectOptions(props.languages, 'language', 'language')}
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
                <Grid item xs={6} sm={8} md={8} lg={8}>
                    {processing ? displayProcessing() : displayCourses(props.courses)}
                </Grid>
            </Grid>
        </Box>
    )
}

export default SearchCourse;
