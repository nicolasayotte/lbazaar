import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Tabs, Tab, Button, Card, CardContent, Grid, Box, Pagination } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import {getRoute} from "../../../../helpers/routes.helper"
import ManageClassTabs from "../components/ManageClassTabs"
import Feedback from "../../../../components/cards/Feedback"

const Feedbacks = () => {

    const { auth, feedbacks, courseId, tabValue, sort, keyword, page } = usePage().props

    const sortOptions = [
        { name: 'Rating - Lowest', value: 'rating:asc' },
        { name: 'Rating - Highest', value: 'rating:desc' },
        { name: 'Date - Oldest',  value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const displayFeedbacks = feedbacks => feedbacks && feedbacks.length > 0 && feedbacks.map(feedback => (
        <Feedback auth={auth} key={feedback.id} feedback={feedback}/>
    ))

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        sort,
        keyword,
        page
    })

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(getRoute('mypage.course.manage_class.feedbacks', { id: courseId}))
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
            <Grid item md={12} lg={12} xs={12}>
                <ManageClassTabs tabValue={tabValue} id={courseId}/>
            </Grid>
            <Grid item md={12} xs={12}>
                <Card sx={{mb: 2}}>
                    <CardContent >
                        <Grid container justifyContent="flex-end" spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for name or email"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4} justifyContent="flex-end">
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
                    </CardContent>
                </Card>
                {displayFeedbacks(feedbacks.data)}
            </Grid>
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={feedbacks.last_page}
                        page={feedbacks.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Feedbacks
