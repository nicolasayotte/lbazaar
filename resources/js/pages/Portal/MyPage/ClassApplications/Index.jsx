import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import ClassApplicationTable from "./components/ClassApplicationTable"
import routes from "../../../../helpers/routes.helper"
import TableLoader from "../../../../components/common/TableLoader"

const Index = () => {

    const {
        courseApplications,
        categoryOptions,
        typeOptions,
        keyword,
        course_type,
        category,
        status,
        sort,
        page,
        translatables,
        title
    } = usePage().props

    const sortOptions = [
        { name: translatables.filters.title.asc, value: 'title:asc' },
        { name: translatables.filters.title.desc, value: 'title:desc' },
        { name: translatables.filters.date.asc, value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
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

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["mypage.course.applications.index"])
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
            <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                <Grid item xs={12} md='auto'>
                    <Typography
                        variant="h5"
                        sx={{ display: { xs: 'none', md: 'inline-block' } }}
                        children={title}
                    />
                </Grid>
                <Grid item xs={12} md='auto'>
                    <Link href={routes["mypage.course.applications.create"]}>
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            children={translatables.title.class.applications.create}
                        />
                    </Link>
                </Grid>
            </Grid>
            <Card sx={{ my: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={10}>
                                <Input
                                    label={translatables.texts.keyword}
                                    placeholder={translatables.texts.search_title}
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2} textAlign="right">
                                <Button
                                    children={translatables.texts.filter}
                                    variant="contained"
                                    fullWidth
                                    onClick={handleFilterSubmit}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    select
                                    label={translatables.texts.type}
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
                            <Grid item xs={12} md={3}>
                                <Input
                                    select
                                    label={translatables.texts.category}
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
                            <Grid item xs={12} md={3}>
                                <Input
                                    select
                                    label={translatables.texts.status}
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
                            <Grid item xs={12} md={3}>
                                <Input
                                    select
                                    label={translatables.texts.sort}
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
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            {
                processing
                ? <TableLoader />
                : <ClassApplicationTable data={courseApplications.data}/>
            }
             <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={courseApplications.last_page}
                        page={courseApplications.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
