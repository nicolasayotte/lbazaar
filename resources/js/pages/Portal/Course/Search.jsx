import { Box, Button, Pagination, Grid, Typography, Container, Card, CardContent, Autocomplete, Chip, TextField } from "@mui/material";
import { useForm, usePage } from '@inertiajs/inertia-react'
import { Inertia } from '@inertiajs/inertia'
import Course from "../../../components/cards/Course";
import Input from "../../../components/forms/Input";
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper";
import routes from "../../../helpers/routes.helper"
import Header from "../../../components/common/Header";
import CardLoader from "../../../components/common/CardLoader";
import EmptyCard from "../../../components/common/EmptyCard"

const SearchCourse = () => {

    const {
        search_text,
        type_id,
        category_ids,
        language,
        professor_id,
        page,
        from,
        to,
        courses,
        languages,
        course_types,
        course_categories,
        teachers,
        translatables
    } = usePage().props

    const { data: filters, setData: setFilters, get, errors, processing, transform } = useForm({
        search_text,
        type_id,
        category_ids: category_ids || [],
        language,
        professor_id,
        from,
        to,
        page,
    })

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes['course.index']);
    }

    const handleOnPaginate = (_, page) => {
        Inertia.get(routes['course.index'], { ...filters, page })
    }

    const displayCourses = (courses, showDescription = true) => {

        if (courses && courses.data && courses.data.length <= 0) {
            return <EmptyCard />
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
            <Container sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Card>
                            <CardContent>
                                <form onSubmit={handleFilterSubmit}>
                                    <Typography variant="h6" sx={{ mb: 2 }} children={translatables.texts.filter} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                placeholder={translatables.texts.search_title}
                                                name="search_text"
                                                value={filters.search_text}
                                                onChange={e => handleOnChange(e, setFilters)}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item  xs={12} sm={12}>
                                            <Input
                                                label={translatables.texts.type}
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
                                            <Autocomplete
                                                multiple
                                                options={course_categories}
                                                getOptionLabel={(option) => option.name}
                                                value={course_categories.filter(cat =>
                                                    (filters.category_ids || []).includes(cat.id)
                                                )}
                                                onChange={(e, newValue) => {
                                                    const ids = newValue.map(v => v.id);

                                                    const newFilters = {
                                                        ...filters,
                                                        category_ids: ids,
                                                        page: 1
                                                    };

                                                    // Update form state for UI consistency
                                                    setFilters(newFilters);

                                                    // Use Inertia.get directly with explicit data
                                                    Inertia.get(routes['course.index'], newFilters);
                                                }}
                                                renderTags={(value, getTagProps) =>
                                                    value.map((option, index) => (
                                                        <Chip
                                                            label={option.name}
                                                            size="small"
                                                            {...getTagProps({ index })}
                                                            key={index}
                                                        />
                                                    ))
                                                }
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label={translatables.texts.category}
                                                        size="small"
                                                        placeholder={filters.category_ids?.length ? '' : 'All'}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                label={translatables.texts.language}
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
                                                {displaySelectOptions(languages)}
                                            </Input>
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                label={translatables.texts.teacher}
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
                                                label={translatables.texts.from}
                                                type="date"
                                                name="from"
                                                value={filters.from}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                InputLabelProps={{ shrink: true }}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={12}>
                                            <Input
                                                label={translatables.texts.to}
                                                type="date"
                                                name="to"
                                                value={filters.to}
                                                onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ min: filters.from }}
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
                                                    children={translatables.texts.filter}
                                                />
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
