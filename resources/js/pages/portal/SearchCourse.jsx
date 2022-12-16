import { Box, TextField, Button, Pagination, CircularProgress, FormControl, InputLabel, Select, MenuItem, Grid, Typography, Container, Card } from "@mui/material";
import SelectInput from "../../components/inputs/SelectInput";
import YearMonthPicker from "../../components/inputs/YearMonthPicker";
import { useForm } from '@inertiajs/inertia-react'
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import Course from "../../components/cards/Course";

const SearchCourse = (props) => {

    const dispatch = useDispatch()


    const { data, setData, get, errors, processing } = useForm({
        search_text: '',
        type_id: null,
        category_id: null,
        language: '',
        professor_id: '',
        year: new Date().getFullYear(),
        month: new Date().getMonth()
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        get('/courses', {
            preserveState: true,
            onSuccess: (response) => {


            },
            onError: (response) => {
                dispatch(actions.toggle({
                    open: true,
                    type: 'error',
                    message: 'There was an error encountered'
                }))
            }
        });
    }

    const handleChangeYearMonth = (year, month) => {
        setData({
            year,
            month
        })
    }

    const errorMessage = (error) => (
        <Typography
            variant="p"
            color="error"
            sx={{
                fontSize: '13px'
            }}
        >{error}</Typography>
    )

    const displayCourses = (courses, showDescription = true) => {
        if (courses.length > 0) {
            return (
                <div>
                    {courses.map(course => {
                        return <Course showDate={true} key={course.id} course={course} showDescription={showDescription}/>
                    })}
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
            <Typography variant="subtitle1" sx={{mt: 3 }} align="center">
                <CircularProgress />
            </Typography>
        )
    }

    return (
        <Box>
            <Card sx={{mt: 2}}>
                <Grid container sx={{m: 4}}>
                    <Grid item xs={10} sm={3} md={3} lg={3}>
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
                                    onChange={e => setData('search_text', e.target.value)}
                                />
                                { errors && errors.search_text && errorMessage(errors.search_text)}
                            </Grid>
                            <Grid item  xs={12} sm={12}>
                                <SelectInput itemValue="id" itemLabel="name" value={data.type_id} handleChange={e => setData('type_id', e.target.value)} label="Type" items={props.course_types}></SelectInput>
                                { errors && errors.type_id && errorMessage(errors.type_id)}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <SelectInput itemValue="id" itemLabel="name" value={data.category_id} handleChange={e => setData('category_id', e.target.value)} label="Categories" items={props.course_categories}></SelectInput>
                                { errors && errors.category_id && errorMessage(errors.category_id)}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <SelectInput itemValue="id" itemLabel="fullname" value={data.professor_id} handleChange={e => setData('professor_id', e.target.value)} label="Teachers" items={props.teachers}></SelectInput>
                                { errors && errors.professor_id && errorMessage(errors.professor_id)}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <SelectInput itemValue="language" itemLabel="language" value={data.language} handleChange={e => setData('language', e.target.value)} label="Languages" items={props.languages}></SelectInput>
                                { errors && errors.language && errorMessage(errors.language)}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <YearMonthPicker minDate="2022-01-01" maxDate="2030-12-01" handleChange={handleChangeYearMonth}></YearMonthPicker>
                                { errors && errors.year && errorMessage(errors.year)}
                                { errors && errors.month && errorMessage(errors.month)}
                            </Grid>
                            <Grid item xs={12} sm={12}>
                                <Grid display="flex" justifyContent="center" alignItems="center">
                                    <Button sx={{ mt: 2}}
                                        onClick={handleSubmit}
                                        variant="contained"
                                        disabled={processing}
                                        disableElevation>
                                        Filter
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
