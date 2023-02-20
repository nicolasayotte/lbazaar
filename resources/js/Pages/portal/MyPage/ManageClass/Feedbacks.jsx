import { useForm, usePage } from "@inertiajs/inertia-react"
import { Button, Card, CardContent, Grid, Box, Pagination, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import {getRoute} from "../../../../helpers/routes.helper"
import Feedback from "../../../../components/cards/Feedback"
import EmptyCard from "../../../../components/common/EmptyCard"

const Feedbacks = () => {

    const { auth, feedbacks, courseId, sort, keyword, page, translatables } = usePage().props

    const sortOptions = [
        { name: translatables.filters.rating.asc, value: 'rating:asc' },
        { name: translatables.filters.rating.desc, value: 'rating:desc' },
        { name: translatables.filters.date.asc,  value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
    ]

    const FeedbackData = () => {

        if (feedbacks && feedbacks.data && feedbacks.data.length <= 0) {
            return <EmptyCard />
        }

        return feedbacks && feedbacks.data && feedbacks.data.length > 0 && feedbacks.data.map(feedback => (
            <Feedback auth={auth} key={feedback.id} feedback={feedback}/>
        ))
    }

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
            <Typography variant="h5" children={translatables.title.feedbacks} />
            <Card sx={{ my: 2 }}>
                <CardContent >
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container justifyContent="flex-end" spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Input
                                    label={translatables.texts.keyword}
                                    placeholder={translatables.texts.search_name}
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={2} justifyContent="flex-end">
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
                            <Grid item xs={12} md={2} textAlign="right">
                                <Button
                                    children={translatables.texts.filter}
                                    variant="contained"
                                    fullWidth
                                    onClick={handleFilterSubmit}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            <FeedbackData />
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={feedbacks.last_page}
                    page={feedbacks.current_page}
                    color="primary"
                />
            </Box>
        </>
    )
}

export default Feedbacks
