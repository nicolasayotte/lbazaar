import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import ClassApplicationTable from "./components/ClassApplicationTable"
import routes from "../../../helpers/routes.helper"
import TableLoader from "../../../components/common/TableLoader"

const Index = () => {

    const { courseApplications, categoryOptions, typeOptions, keyword, course_type, category, status, sort, page } = usePage().props

    const sortOptions = [
        { name: 'Title A-Z', value: 'title:asc' },
        { name: 'Title Z-A', value: 'title:desc' },
        { name: 'Price - Low to High', value: 'price:asc' },
        { name: 'Price - High to Low', value: 'price:desc' },
        { name: 'Date - Oldest', value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const statusOptions = [
        { name: 'Pending', value: 'pending' },
        { name: 'Denied', value: 'denied' },
        { name: 'Approved', value: 'approved' }
    ]

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        course_type,
        category,
        status,
        sort,
        page
    })

    const handleOnChange = (e) => {
        setFilters(e.target.name, e.target.value)
    }

    const handleSelectChange = (e) => {
        transform(filters => ({
            ...filters,
            page: 1,
            [e.target.name]: e.target.value
        }))

        handleFilterSubmit(e)
    }

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["admin.class.applications.index"])
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleFilterSubmit(e)
    }

    return (
        <Box>
            <Typography
                variant="h4"
                children="Class Applications"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for title or teacher"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={handleOnChange}
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
                                    onChange={handleSelectChange}
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
                                    onChange={handleSelectChange}
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
                                    onChange={handleSelectChange}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(statusOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Sort"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="sort"
                                    value={filters.sort}
                                    onChange={handleSelectChange}
                                >
                                    {displaySelectOptions(sortOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={1} textAlign="right">
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
                : <ClassApplicationTable data={courseApplications.data}/>
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={courseApplications.last_page}
                    page={courseApplications.current_page}
                    color="primary"
                />
            </Box>
        </Box>
    )
}

export default Index
