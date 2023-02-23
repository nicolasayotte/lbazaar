
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import TableLoader from "../../../../components/common/TableLoader"
import CourseHistoryTable from "./components/CourseHistoryTable"

const Index = ({ errors }) => {

    const { course_histories, month, status, page, keyword, sort, type_id, category_id, course_categories, course_types } = usePage().props

    const sortItems = [
        { name: 'Class Title A-Z', value: 'courses.title:asc' },
        { name: 'Class Title Z-A', value: 'courses.title:desc' },
        { name: 'Teacher A-Z', value: 'users.first_name:asc' },
        { name: 'Teacher Z-A', value: 'users.first_name:desc' },
        { name: 'Date ASC', value: 'course_histories.created_at:asc' },
        { name: 'Date DESC', value: 'course_histories.created_at:desc' }
    ]

    const statusItems = [
        { name: 'Ongoing', value: 'Ongoing' },
        { name: 'Completed', value: 'Completed' }
    ]

    const { data: filters, setData: setFilters, get, processing, transform } = useForm({
        keyword,
        type_id,
        category_id,
        status,
        month,
        sort,
        page
    })

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["mypage.course.history.index"])
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleFilterSubmit(e)
    }

    return (
        <>
            <Card sx={{ mb: 2, width: '100%' }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={10}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for Title, Description or Teacher Name"
                                    size="small"
                                    name="keyword"
                                    autoFocus
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Type"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    select
                                    name="type_id"
                                    value={filters.type_id}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                    errors={errors}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(course_types)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Category"
                                    select
                                    name="category_id"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    value={filters.category_id}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                    errors={errors}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(course_categories)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Status"
                                    select
                                    name="status"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    value={filters.status}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                    errors={errors}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(statusItems, 'value', 'name')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Input
                                    type="month"
                                    name="month"
                                    value={filters.month}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Sort By"
                                    select
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="sort"
                                    value={filters.sort}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    {displaySelectOptions(sortItems, 'value', 'name')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={12} textAlign="right">
                                <Box>
                                    <Button
                                        variant="contained"
                                        children="Filter"
                                        type="submit"
                                        onClick={handleFilterSubmit}
                                    />
                                </Box>
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
