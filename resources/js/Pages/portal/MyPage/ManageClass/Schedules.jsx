import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import TableLoader from "../../../../components/common/TableLoader"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnSelectChange } from "../../../../helpers/form.helper"
import { getRoute } from "../../../../helpers/routes.helper"
import ScheduleTable from "./components/ScheduleTable"

const Schedules = () => {

    const { schedules, translatables, course, month, page, status, sort } = usePage().props

    const statusOptions = [
        { name: 'All', value: '' },
        { name: 'Upcoming', value: 'upcoming' },
        { name: 'Ongoing', value: 'ongoing' },
        { name: 'Done', value: 'done' }
    ]

    const sortOptions = [
        { name: translatables.filters.date.asc, value: 'start_datetime:asc' },
        { name: translatables.filters.date.desc, value: 'start_datetime:desc' }
    ]

    const { data: filters, setData: setFilters, get, processing, transform } = useForm({
        month,
        status,
        sort,
        page
    })

    const handleOnFilterSubmit = e => {
        e.preventDefault()

        get(getRoute('mypage.course.manage_class.schedules', { id: course.id }))
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleOnFilterSubmit(e)
    }

    return (
        <>
            <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h5" children={translatables.title.schedules} />
                </Grid>
                <Grid item xs={12} md="auto">
                    <Link href={getRoute('exams.create', { id: course.id })}>
                        <Button
                            variant="contained"
                            children={translatables.texts.create_schedule}
                            color="success"
                            sx={{ width: { xs: '100%', md: 'auto' } }}
                            startIcon={<Add />}
                        />
                    </Link>
                </Grid>
            </Grid>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleOnFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Input
                                    type="month"
                                    label={translatables.texts.date}
                                    InputLabelProps={{ shrink: true }}
                                    name="month"
                                    value={filters.month}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleOnFilterSubmit)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label={translatables.texts.status}
                                    select
                                    InputLabelProps={{ shrink: true }}
                                    name="status"
                                    value={filters.status}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleOnFilterSubmit)}
                                    children={displaySelectOptions(statusOptions, 'value')}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label={translatables.texts.sort}
                                    select
                                    InputLabelProps={{ shrink: true }}
                                    name="sort"
                                    value={filters.sort}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleOnFilterSubmit)}
                                    children={displaySelectOptions(sortOptions, 'value')}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                    children={translatables.texts.filter}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            {
                processing
                ? <TableLoader />
                : <ScheduleTable data={schedules.data} />
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={schedules.last_page}
                    page={schedules.current_page}
                    color="primary"
                />
            </Box>
        </>
    )
}

export default Schedules
