import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import TableLoader from "../../../components/common/TableLoader"
import Input from "../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper"
import routes from "../../../helpers/routes.helper"
import InquiryTable from "./components/InquiryTable"

const Index = () => {

    const { inquiries, page, keyword, sort, translatables } = usePage().props

    const sortItems = [
        { name: translatables.filters.name.asc, value: 'name:asc' },
        { name: translatables.filters.name.desc, value: 'name:desc' },
        { name: translatables.filters.date.asc, value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
    ]

    const { data: filters, setData: setFilters, get, processing, transform } = useForm({
        keyword,
        sort,
        page
    })

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
                children={translatables.title.translations}
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Input
                                    label={translatables.texts.keyword}
                                    placeholder={translatables.texts.search_name_email_subject}
                                    size="small"
                                    name="keyword"
                                    autoFocus
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label={translatables.texts.sort}
                                    select
                                    name="sort"
                                    children={displaySelectOptions(sortItems, 'value', 'name')}
                                    value={filters.sort}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    variant="contained"
                                    children={translatables.texts.filter}
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
                : <InquiryTable data={inquiries.data} />
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
