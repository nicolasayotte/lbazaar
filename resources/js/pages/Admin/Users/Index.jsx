import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import UserTable from "./components/UserTable"
import routes from "../../../helpers/routes.helper"
import TableLoader from "../../../components/common/TableLoader"

const Index = () => {

    const { users, roleOptions, statusOptions, status, keyword, role, sort } = usePage().props

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword: keyword,
        status: status,
        role: role,
        sort: sort,
        page: 1
    })

    const sortOptions = [
        { name: 'Name A-Z', value: 'first_name:asc' },
        { name: 'Name Z-A', value: 'first_name:desc' },
        { name: 'Date ASC',  value: 'created_at:asc' },
        { name: 'Date DESC', value: 'created_at:desc' }
    ]

    const handleKeywordChange = e => {
        setFilters(filters => ({
            ...filters,
            page: 1,
            [e.target.name]: e.target.value
        }))
    }

    const handleSelectChange = e => {
        transform(filters => ({
            ...filters,
            page: 1,
            [e.target.name]: e.target.value
        }))

        handleFilterSubmit(e)
    }

    const handleFilterSubmit = e => {
        e.preventDefault()

        get(routes["admin.users.index"], {
            data: filters
        })
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
                children="Users"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={5}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for name or email"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={handleKeywordChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Role"
                                    select
                                    name="role"
                                    value={filters.role}
                                    onChange={handleSelectChange}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(roleOptions, 'value', 'name')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Status"
                                    select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleSelectChange}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(statusOptions, 'value', 'name')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Sort"
                                    select
                                    name="sort"
                                    value={filters.sort}
                                    children={displaySelectOptions(sortOptions, 'value', 'name')}
                                    onChange={handleSelectChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    children="Filter"
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
                : <UserTable data={users.data} />
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={users.last_page}
                    page={users.current_page}
                    color="primary"
                />
            </Box>
        </Box>
    )
}

export default Index
