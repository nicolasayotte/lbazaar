import { Box, TextField, Button, Pagination, Skeleton, Stack, InputLabel, Select, MenuItem, Grid, Typography, Container, Card } from "@mui/material";
import SelectInput from '../../components/forms/SelectInput';
import YearMonthPicker from '../../components/forms/YearMonthPicker';
import { useForm } from '@inertiajs/inertia-react'
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import ErrorText from '../../components/common/ErrorText'
import Course from "../../components/cards/Course";

const SearchCourse = (props) => {

    const dispatch = useDispatch()

    const FIRST_PAGE = 1

    const { data, setData, get, errors, processing, reset, clearErrors } = useForm({
        search_text: '',
        type_id: '',
        category_id: '',
        language: '',
        professor_id: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
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

    const handleChangeYearMonth = (year, month) => {
        setData({
            year,
            month
        }) 
    }

    const displayCourses = (courses, showDescription = true) => {
        if (courses.data.length > 0) {
            return (
                <div>
                    {courses.data.map(course => {
                        return <Course showDate={true} key={course.id} course={course} showDescription={showDescription}/>
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

    return (
        <Box>
            <Card sx={{mt: 2}}>
                <Grid container sx={{m: 4}}>
                    <Grid item xs={10} sm={3} md={3} lg={3}>
                        {data.category_id}
                            <Typography variant="h6">
                                Filter
                            </Typography>
                            <Grid item xs={12} sm={12}>
                                <TextField
                                    required
                                    fullWidth
                                    placeholder="Search for classes"
                                    size="small"
                                    sx={{mt:1}}
                                    value={data.search_text}
                                    onChange={e => setData('search_text', e.target.value)}
                                />
                                { errors && errors.search_text && <ErrorText error={errors.search_text}/>}
                            </Grid>
                            <Grid item  xs={12} sm={12}>
                                <SelectInput itemValue="id" itemLabel="name" value={data.type_id} handleChange={e => setData('type_id', e.target.value)} label="Type" items={props.course_types}></SelectInput>
                                { errors && errors.type_id && <ErrorText error={errors.type_id}/>}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <SelectInput itemValue="id" itemLabel="name" value={data.category_id} handleChange={e => setData('category_id', e.target.value)} label="Categories" items={props.course_categories}></SelectInput>
                                { errors && errors.category_id && <ErrorText error={errors.category_id}/>}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <SelectInput itemValue="id" itemLabel="fullname" value={data.professor_id} handleChange={e => setData('professor_id', e.target.value)} label="Teachers" items={props.teachers}></SelectInput>
                                { errors && errors.professor_id && <ErrorText error={errors.professor_id}/>}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <SelectInput itemValue="language" itemLabel="language" value={data.language} handleChange={e => setData('language', e.target.value)} label="Languages" items={props.languages}></SelectInput>
                                { errors && errors.language && <ErrorText error={errors.language}/>}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <YearMonthPicker errors={errors} minDate="2022-01-01" maxDate="2030-12-01" handleChange={handleChangeYearMonth}></YearMonthPicker>
                                { errors && errors.year && <ErrorText error={errors.year}/>}
                                { errors && errors.month && <ErrorText error={errors.month}/>}
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
                    <Grid item xs={6} sm={8} md={8} lg={8}>
                        {processing ? displayProcessing() : displayCourses(props.courses)}
                    </Grid>
                </Grid>
            </Card>
        </Box>
    )
}

export default SearchCourse;
