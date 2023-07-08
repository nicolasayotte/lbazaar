import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Add, TramSharp } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import TableLoader from "../../../../components/common/TableLoader"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnSelectChange } from "../../../../helpers/form.helper"
import { getRoute } from "../../../../helpers/routes.helper"
import ScheduleTable from "./components/ScheduleTable"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"
import { Inertia } from "@inertiajs/inertia"

const Schedules = () => {

    const { schedules, translatables, course, nft, from, to, page, status, sort } = usePage().props
    
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

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.texts.delete_schedule,
        text: translatables.confirm.schedules.delete,
        submitUrl: ''
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

    const handleOnDelete = id => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            submitUrl: getRoute('schedules.delete', { id: id })
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogConfirm = () => {
        Inertia.delete(dialog.submitUrl)

        handleOnDialogClose()
    }

    return (
        <>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogConfirm}
            />
            <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h5" children={translatables.title.schedules.index} />
                </Grid>
                <Grid item xs={12} md="auto">
                    <Link href={getRoute('schedules.create', { id: course.id })}>
                        <Button
                            variant="contained"
                            children={translatables.title.schedules.create}
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
                : <ScheduleTable data={schedules.data} handleOnDelete={handleOnDelete} />
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
