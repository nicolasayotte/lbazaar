import { useForm, usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Grid, Pagination, Stack, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import CourseCategoryTable from "./components/CourseCategoryTable"
import TableLoader from "../../../components/common/TableLoader"
import { handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper"
import routes from "../../../helpers/routes.helper"

const CourseCategory = () => {

    const { categories, keyword, sort, page } = usePage().props

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        sort,
        page
    })

    const sortOptions = [
        { name: 'Name A-Z', value: 'name:asc' },
        { name: 'Name Z-A', value: 'name:desc' },
        { name: 'Date - Oldest', value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const handleFilterSubmit = e => {
        e.preventDefault()

        get(routes["admin.settings.categories.index"])
    }

    const handleOnPaginate = (e, page) => {
        transform(data => ({
            ...data,
            page
        }))

        handleFilterSubmit(e)
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children="Categories"
                />
                <Button
                    children="Create Category"
                    variant="contained"
                    startIcon={
                        <Add/>
                    }
                />
            </Stack>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for name"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Sort"
                                    select
                                    name="sort"
                                    value={filters.sort}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    {displaySelectOptions(sortOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button
                                    children="Filter"
                                    variant="contained"
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            {
                processing
                ? <TableLoader />
                : <CourseCategoryTable data={categories.data} />
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={categories.last_page}
                    page={categories.current_page}
                    color="primary"
                />
            </Box>
        </Box>
    )
}

export default CourseCategory
