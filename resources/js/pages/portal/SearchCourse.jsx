import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, Typography, Container } from "@mui/material";
import SelectInput from "../../components/inputs/SelectInput";
import YearMonthPicker from "../../components/inputs/YearMonthPicker";
import { useForm } from '@inertiajs/inertia-react'

const SearchCourse = (props) => {


    const { data, setData, post, processing, errors } = useForm({
        searchText: '',
        type: null,
        category: null,
        language: '',
        teacherId: '',
        yearClass: '',
        monthClass: ''
    })

    function submit(e) {
        e.preventDefault()
        post('/login')
    }

    const handleChangeYearMonth = (yearClass, monthClass) => {
        setData({
            yearClass,
            monthClass
        })
    }


    return (
        <div>
             <Container maxWidth="lg" sx={{mt:4}}>
                <Grid container>
                    <Grid item container spacing={2} xs={12} sm={3} md={3} lg={3}>
                        <Typography variant="h6">
                            Filter
                        </Typography>
                        <Grid item xs={12} sm={12}>
                            {data.searchText}
                            <TextField
                                required
                                fullWidth
                                placeholder="Search for classes"
                                size="small"
                                sx={{mt:1}}
                                onChange={e => setData('searchText', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6} sm={12}>
                            <SelectInput itemValue="id" itemLabel="name" value={data.type} handleChange={e => setData('type', e.target.value)} label="Types" items={props.course_types}></SelectInput>
                        </Grid>
                        <Grid item xs={6} sm={12}>
                            <SelectInput itemValue="id" itemLabel="name" value={data.category} handleChange={e => setData('category', e.target.value)} label="Categories" items={props.course_categories}></SelectInput>
                        </Grid>
                        <Grid item xs={6} sm={12}>
                            <SelectInput itemValue="id" itemLabel="fullname" label="Teachers" items={props.teachers}></SelectInput>
                        </Grid>
                        <Grid item xs={6} sm={12}>
                            <SelectInput itemValue="language" itemLabel="language"  value={data.language} handleChange={e => setData('language', e.target.value)} label="Languages" items={props.languages}></SelectInput>
                        </Grid>
                        <Grid item xs={6} sm={12}>
                            <YearMonthPicker minDate="2022-01-01" maxDate="2030-12-01" handleChange={handleChangeYearMonth}></YearMonthPicker>
                        </Grid>

                        <Grid item xs={12} sm={12}>
                            <Grid display="flex" justifyContent="center" alignItems="center">
                                <Button sx={{ mt: 2}} variant="contained" disableElevation>
                                    Filter
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={9} lg={9}>
                    </Grid>
                </Grid>
            </Container>
        </div>
    )
}

export default SearchCourse;
