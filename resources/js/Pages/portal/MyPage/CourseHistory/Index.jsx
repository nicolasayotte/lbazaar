
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { displaySelectOptions } from "../../../../helpers/form.helper"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import TableLoader from "../../../../components/common/TableLoader"
import CourseHistoryTable from "../components/CourseHistoryTable"

const Index = ({ errors }) => {

    const { course_histories, month, page, keyword, sort, type_id, category_id, course_categories, course_types } = usePage().props

    const sortItems = [
        { name: 'Course Title A-Z', value: 'courses.title:asc' },
        { name: 'Course Title Z-A', value: 'courses.title:desc' },
        { name: 'Teacher A-Z', value: 'users.first_name:asc' },
        { name: 'Teacher Title Z-A', value: 'users.first_name:desc' },
        { name: 'Date ASC', value: 'course_histories.created_at:asc' },
        { name: 'Date DESC', value: 'course_histories.created_at:desc' }
    ]

    const { data: filters, setData: setFilters, get, processing, transform } = useForm({
        keyword: keyword,
        type_id: type_id,
        category_id: category_id,
        month: month,
        sort: sort,
        page: page
    })

    const handleKeywordChange = e => {
        setFilters(filters => ({
            ...filters,
            page: 1,
            [e.target.name]: e.target.value
        }))
    }

    const handleOnChange = e => {
        setFilters((filters) => ({
            ...filters,
            page: 1,
            [e.target.name]: e.target.value
        }))
    }

    const handleOnSortChange = e => {
        setFilters((filters) => ({
            ...filters,
            page: 1,
            [e.target.name]: e.target.value
        }))
    }

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["mypage.course.history.index"])
    }

    const handleOnPaginate = (e, page) => {
        filters.page = page
        handleFilterSubmit(e)
    }

    return (
        <>
            <Card sx={{ mb: 2, width: '100%' }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={12}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for Title, Description or Teacher Name"
                                    size="small"
                                    name="keyword"
                                    autoFocus
                                    value={filters.keyword}
                                    onChange={handleKeywordChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Type"
                                    select
                                    name="type_id"
                                    value={filters.type_id}
                                    onChange={handleOnChange}
                                    errors={errors}
                                >
                                    <option value=""></option>
                                    {displaySelectOptions(course_types)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Category"
                                    select
                                    name="category_id"
                                    value={filters.category_id}
                                    onChange={handleOnChange}
                                    errors={errors}
                                >
                                    <option value=""></option>
                                    {displaySelectOptions(course_categories)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Input
                                    type="month"
                                    name="month"
                                    value={filters.month}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Sort By"
                                    select
                                    name="sort"
                                    children={displaySelectOptions(sortItems, 'value', 'name')}
                                    value={filters.sort}
                                    onChange={handleOnSortChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    variant="contained"
                                    children="Filter"
                                    fullWidth
                                    type="submit"
                                    onClick={handleFilterSubmit}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            {
                processing
                ? <TableLoader />
                : <CourseHistoryTable data={course_histories.data}/>
            }
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={course_histories.last_page}
                        page={course_histories.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
