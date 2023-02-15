import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import ClassManageTable from "./components/ClassManageTable"
import routes from "../../../../helpers/routes.helper"
import TableLoader from "../../../../components/common/TableLoader"

const Index = () => {

    const { courses, categoryOptions, typeOptions, keyword, course_type, category, status, sort, page } = usePage().props

    const sortOptions = [
        { name: 'Title A-Z', value: 'courses.title:asc' },
        { name: 'Title Z-A', value: 'courses.title:desc' },
        { name: 'Published Date - Oldest', value: 'course_schedules.start_datetime:asc' },
        { name: 'Published Date - Newest', value: 'course_schedules.start_datetime:desc' }
    ]

    const statusOptions = [
        { name: 'Draft', value: 'draft' },
        { name: 'Published', value: 'published' },
        { name: 'Completed', value: 'completed' },
    ]

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        course_type,
        category,
        status,
        sort,
        page
    })

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["mypage.course.manage_class.index"])
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
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={12}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for title or teacher"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Type"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="course_type"
                                    value={filters.course_type}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(typeOptions)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Category"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="category"
                                    value={filters.category}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(categoryOptions)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Status"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="status"
                                    value={filters.status}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(statusOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Input
                                    select
                                    label="Sort"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="sort"
                                    value={filters.sort}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    {displaySelectOptions(sortOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2} textAlign="right">
                                <Button
                                    children="Filter"
                                    variant="contained"
                                    fullWidth
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
                : <ClassManageTable data={courses.data}/>
            }
             <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={courses.last_page}
                        page={courses.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
