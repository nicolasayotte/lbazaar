
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import MyPage from "../../../../layouts/MyPage"
import { displaySelectOptions } from "../../../../helpers/form.helper"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"

const Index = ({ auth, course_types, course_categories, teachers, countries, errors, messages, window }) => {

    const { page, keyword, sort, type_id, category_id } = usePage().props

    const getCurrentDate = () => {
        const today = new Date()

        let year  = today.getFullYear().toString(),
            month = (today.getMonth() + 1).toString(),
            day   = today.getDate().toString()

            month = month.padStart(2, '0')
            day = day.padStart(2, '0')

        return [year, month, day].join('-')
    }

    const sortItems = [
        { name: 'Course Title A-Z', value: 'title:asc' },
        { name: 'Course Title Z-A', value: 'title:desc' },
        { name: 'Date ASC', value: 'created_at:asc' },
        { name: 'Date DESC', value: 'created_at:desc' }
    ]

    const { data: filters, setData: setFilters, get, processing, transform } = useForm({
        keyword: keyword,
        type_id: type_id,
        category_id: category_id,
        month: getCurrentDate().slice(0, 7),
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

    const handleOnSortChange = e => {
        transform(data => ({
            ...data,
            page: 1,
            [e.target.name]: e.target.value,
        }))

        handleFilterSubmit(e)
    }

    const handleOnChange = e => {
        setData(e.target.name, e.target.value)
    }

    const content = (
        <>
            <Card sx={{ mb: 2, width: '100%' }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={12}>
                            <Input
                                label="Keyword"
                                placeholder="Search for name, email or subject"
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
                        <Grid item xs={12} sm={2}>
                            <Input
                                type="month"
                                name="month"
                                value={filters.month}
                                onChange={handleOnChange}
                                errors={errors}
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
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </>
    )

    return (
        <MyPage 
            auth={auth} 
            countries={countries} 
            errors={errors} 
            messages={messages} 
            window={window} 
            content={content}>
        </MyPage>
    )
}

export default Index
