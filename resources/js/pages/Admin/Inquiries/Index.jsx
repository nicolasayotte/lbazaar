import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import TableLoader from "../../../components/common/TableLoader"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import routes from "../../../helpers/routes.helper"
import Table from "./components/Table"

const Index = () => {

    const { inquiries, page, keyword, sort } = usePage().props

    const sortItems = [
        { name: 'Name A-Z', value: 'name:asc' },
        { name: 'Name Z-A', value: 'name:desc' },
        { name: 'Date ASC', value: 'created_at:asc' },
        { name: 'Date DESC', value: 'created_at:desc' }
    ]

    const { data: filters, setData: setFilters, get, processing, transform } = useForm({
        keyword: keyword,
        sort: sort,
        page: page
    })

    const handleOnSortChange = e => {
        transform(data => ({
            ...data,
            page: 1,
            [e.target.name]: e.target.value,
        }))

        handleFilterSubmit(e)
    }

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["admin.inquiries.index"])
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
            <Typography
                variant="h4"
                children="Inquiries"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for keyword"
                                    size="small"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => setFilters(e.target.name, e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
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
                : <Table data={inquiries.data} />
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={inquiries.last_page}
                    page={inquiries.current_page}
                    color="primary"
                />
            </Box>
        </Box>
    )
}

export default Index
