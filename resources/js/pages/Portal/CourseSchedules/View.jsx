import { Inertia } from "@inertiajs/inertia"
import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { CalendarMonth, PeopleAlt, Timelapse } from "@mui/icons-material"
import { Box, Breadcrumbs, Button, Card, CardContent, Container, Grid, Pagination, Paper, Stack, Typography } from "@mui/material"
import { useState } from "react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import TableLoader from "../../../components/common/TableLoader"
import Input from "../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper"
import routes, { getRoute } from "../../../helpers/routes.helper"
import StudentsTable from "./components/StudentsTable"

const View = () => {

    const { students, course, translatables, schedule, keyword, sort, page } = usePage().props

    const sortOptions = [
        { name: translatables.filters.name.asc, value: 'fullname:asc' },
        { name: translatables.filters.name.desc, value: 'fullname:desc' },
        { name: translatables.filters.date.asc, value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' },
    ]

    const { data: filters, setData: setFilters, transform, processing, get } = useForm({
        keyword,
        sort,
        page
    })

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.schedules.index,
        text: translatables.confirm.schedules.update,
        submitUrl: getRoute('schedules.status.update', { id: schedule.id })
    })

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleOnFilterSubmit(e)
    }

    const handleOnFilterSubmit = e => {
        e.preventDefault()

        get(getRoute('schedules.view', { id: schedule.id }))
    }

    const handleOnDone = () => {
        setDialog(dialog => ({
            ...dialog,
            open: true
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = () => {
        Inertia.patch(dialog.submitUrl, undefined, {
            onSuccess: () => handleOnDialogClose()
        })
    }

    const isLive = course.is_live

    return (
        <>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogSubmit}
            />
            <Container sx={{ py: 5, minHeight: '100vh' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={schedule.is_completed ? 10 : 8}>
                        <Typography variant="h5" children={translatables.title.schedules.view} gutterBottom />
                        <Breadcrumbs>
                            <Link href={routes["mypage.course.manage_class.index"]} children={translatables.title.class.manage.index} />
                            <Link
                                href={getRoute('mypage.course.manage_class.schedules', { id: course.id })}
                                children={`${translatables.title.class.manage.view} - ${translatables.title.schedules.index}`}
                            />
                            <Typography color="text.primary" children={translatables.title.schedules.view} />
                        </Breadcrumbs>
                    </Grid>
                    <Grid item xs={12} md={schedule.is_completed ? 2 : 4}>
                        <Stack direction={{ xs: 'column-reverse', md: 'row' }} spacing={2} alignItems="center">
                            <Link href={getRoute('mypage.course.manage_class.schedules', { id: course.id })} style={{ width: '100%' }}>
                                <Button
                                    variant="outlined"
                                    children={translatables.texts.back}
                                    fullWidth
                                />
                            </Link>
                            {
                                !schedule.is_completed &&
                                <Button
                                    variant="contained"
                                    children={translatables.texts.mark_done}
                                    fullWidth
                                    onClick={handleOnDone}
                                />
                            }
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" display="flex" alignItems="center" spacing={2}>
                                <CalendarMonth fontSize="large" />
                                <Box children={schedule.simple_start_datetime} />
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" display="flex" alignItems="center" spacing={2}>
                                <PeopleAlt fontSize="large" />
                                <Box>
                                    {
                                        isLive? schedule.total_bookings + '/' + schedule.max_participant : schedule.total_bookings
                                    }
                                </Box>
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" display="flex" alignItems="center" spacing={2}>
                                <Timelapse fontSize="large" />
                                <Box children={schedule.status} />
                            </Stack>
                        </Paper>
                    </Grid>
                    <Grid item xs={12}>
                        <form onSubmit={handleOnFilterSubmit}>
                            <Card>
                                <CardContent>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={8}>
                                            <Input
                                                label={translatables.texts.keyword}
                                                placeholder={translatables.texts.search_name_email}
                                                name="keyword"
                                                value={filters.keyword}
                                                onChange={e => handleOnChange(e, setFilters)}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={2}>
                                            <Input
                                                select
                                                label={translatables.texts.sort}
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
                                                children={translatables.texts.filter}
                                                fullWidth
                                                onClick={handleOnFilterSubmit}
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </form>
                    </Grid>
                    <Grid item xs={12}>
                        {
                            processing
                            ? <TableLoader />
                            : <StudentsTable data={students.data} exams={course.exams} course={course} schedule={schedule} />
                        }
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <Pagination
                                onChange={handleOnPaginate}
                                count={students.last_page}
                                page={students.current_page}
                                color="primary"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </>
    )
}

export default View
