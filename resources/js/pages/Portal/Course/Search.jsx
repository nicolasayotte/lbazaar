import { Box, Button, Pagination, Skeleton, Stack, Grid, Typography, Container, Card, CardContent } from "@mui/material";
import { useForm, usePage } from '@inertiajs/inertia-react'
import Course from "../../../components/cards/Course";
import Input from "../../../components/forms/Input";
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper";
import routes from "../../../helpers/routes.helper"
import Header from "../../../components/common/Header";
import CardLoader from "../../../components/common/CardLoader";
import EmptyCard from "../../../components/common/EmptyCard"

const SearchCourse = () => {

    const { search_text, type_id, category_id, language, professor_id, month, page, courses, course_types, course_categories, teachers, languages, messages, translatables} = usePage().props

    const { data: filters, setData: setFilters, get, errors, processing, transform } = useForm({
        search_text,
        type_id,
        category_id,
        language,
        professor_id,
        month,
        page,
    })


    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes['course.index']);
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleFilterSubmit(e)
    }

    const displayCourses = (courses, showDescription = true) => {

        if (courses && courses.data && courses.data.length <= 0) {
            return (
                <Typography variant="h4" children="No records found" textAlign="center" sx={{ p: 4 }} />
            )
        }

        return courses.data.map(course => (
            <Course showDate={true} key={course.id} course={course} viewDetailId="id" showDescription={showDescription}/>
        ))
    }

    const displayProcessing = () => {
        return (
            <>
                <CardLoader />
                <CardLoader />
                <CardLoader />
            </>
        )
    }

    return (
        <>
            <Header>
                <Container sx={{ position: 'relative', zIndex: 500 }}>
                    <Typography variant="h4" children={translatables.texts.browse_classes} textAlign="center" />
                </Container>
            </Header>
            <Container sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <form onSubmit={handleFilterSubmit}>
                                    <Typography variant="h6" sx={{ mb: 2 }} children="Filters" />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                placeholder="Search for classes"
                                                name="search_text"
                                                value={filters.search_text}
                                                onChange={e => handleOnChange(e, setFilters)}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item  xs={12} sm={12}>
                                            <Input
                                                label="Type"
                                                select
                                                name="type_id"
                                                value={filters.type_id}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                errors={errors}
                                                InputLabelProps={{
                                                    shrink: true
                                                }}
                                            >
                                                <option value="">All</option>
                                                {displaySelectOptions(course_types)}
                                            </Input>
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                label="Category"
                                                select
                                                name="category_id"
                                                value={filters.category_id}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                errors={errors}
                                                InputLabelProps={{
                                                    shrink: true
                                                }}
                                            >
                                                <option value="">All</option>
                                                {displaySelectOptions(course_categories)}
                                            </Input>
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                label="Teachers"
                                                select
                                                name="professor_id"
                                                value={filters.professor_id}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                errors={errors}
                                                InputLabelProps={{
                                                    shrink: true
                                                }}
                                            >
                                                <option value="">All</option>
                                                {displaySelectOptions(teachers, 'id', 'fullname')}
                                            </Input>
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                label="Languages"
                                                select
                                                name="language"
                                                value={filters.language}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                errors={errors}
                                                InputLabelProps={{
                                                    shrink: true
                                                }}
                                            >
                                                <option value="">All</option>
                                                {displaySelectOptions(languages, 'language', 'language')}
                                            </Input>
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                type="month"
                                                name="month"
                                                value={filters.month}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Grid display="flex" justifyContent="center" alignItems="center">
                                                <Button
                                                variant="contained"
                                                type="submit"
                                                onClick={handleFilterSubmit}
                                                fullWidth
                                                >
                                                    Filter
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        {processing ? displayProcessing() : displayCourses(courses)}
                        {
                            courses && courses.data && courses.data.length > 0 &&
                            <Box display="flex" justifyContent="center">
                                <Pagination
                                    sx={{mt: 2, justifyContent: 'center'}}
                                    onChange={handleOnPaginate}
                                    page={courses.current_page}
                                    count={courses.last_page}
                                    color="primary"
                                />
                            </Box>
                        }
                    </Grid>
                </Grid>
            </Container>
        </>
    )
}

export default SearchCourse;
