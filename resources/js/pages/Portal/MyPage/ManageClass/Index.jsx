import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import ClassManageTable from "./components/ClassManageTable"
import routes from "../../../../helpers/routes.helper"
import TableLoader from "../../../../components/common/TableLoader"

const Index = () => {

    const { courses, categoryOptions, typeOptions, keyword, course_type, category, format, sort, page, translatables } = usePage().props

    const sortOptions = [
        { name: translatables.filters.title.asc, value: 'courses.title:asc' },
        { name: translatables.filters.title.desc, value: 'courses.title:desc' },
        { name: translatables.filters.date.asc, value: 'course_schedules.start_datetime:asc' },
        { name: translatables.filters.date.desc, value: 'course_schedules.start_datetime:desc' }
    ]

    const formatOptions = [
        { name: 'All', value: '' },
        { name: 'Live', value: 'live' },
        { name: 'On-Demand', value: 'on-demand' }
    ]

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        course_type,
        category,
        format,
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
                                    label={translatables.texts.format}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="format"
                                    value={filters.format}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    {displaySelectOptions(formatOptions, 'value')}
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
