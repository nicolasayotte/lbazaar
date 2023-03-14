
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Grid, Pagination, Card, CardContent, Button } from "@mui/material"
import TableLoader from "../../../../components/common/TableLoader"
import ScheduleTable from "./components/ScheduleTable"
import { useEffect, useState } from "react"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnSelectChange } from "../../../../helpers/form.helper"

const Index = ({ errors }) => {

    const { schedules, translatables, course, from, to, page, status, sort } = usePage().props

    const statusOptions = [
        { name: 'All', value: '' },
        { name: 'Upcoming', value: 'upcoming' },
        { name: 'Ongoing', value: 'ongoing' },
        { name: 'Done', value: 'done' }
    ]

    const sortOptions = [
        { name: translatables.filters.schedule.asc, value: 'start_datetime:asc' },
        { name: translatables.filters.schedule.desc, value: 'start_datetime:desc' }
    ]

    const { data: filters, get, processing, transform } = useForm({
        from,
        to,
        status,
        sort,
        page
    })

    const handleOnFilterSubmit = e => {
        e.preventDefault()
        get(routes["mypage.schedules"])
        // get(getRoute('mypage.course.manage_class.schedules', { id: course.id }))
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
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleOnFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Input
                                    type="date"
                                    label={translatables.texts.from}
                                    InputLabelProps={{ shrink: true }}
                                    name="from"
                                    value={filters.from}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleOnFilterSubmit)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    type="date"
                                    label={translatables.texts.to}
                                    InputLabelProps={{ shrink: true }}
                                    name="to"
                                    value={filters.to}
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
                : <ScheduleTable data={schedules.data}/>
            }
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={schedules.last_page}
                        page={schedules.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
