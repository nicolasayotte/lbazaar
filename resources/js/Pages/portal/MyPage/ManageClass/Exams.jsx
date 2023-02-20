import { Inertia } from "@inertiajs/inertia"
import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import { getRoute } from "../../../../helpers/routes.helper"
import ExamTable from "./components/ExamTable"
import { actions } from "../../../../store/slices/ToasterSlice"
import { useState } from "react"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"
import { Add } from "@mui/icons-material"
import TableLoader from "../../../../components/common/TableLoader"

const Exams = () => {

    const dispatch = useDispatch()

    const { courseId, translatables, exams, keyword, status, sort, page } = usePage().props

    const statusOptions = [
        { name: translatables.texts.all, value: '' },
        { name: translatables.filters.status.active, value: 'active' },
        { name: translatables.filters.status.disabled, value: 'disabled' }
    ]

    const sortOptions = [
        { name: translatables.filters.name.asc, value: 'name:asc' },
        { name: translatables.filters.name.desc, value: 'name:desc' },
        { name: translatables.filters.date.asc, value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
    ]

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        status,
        sort,
        page,
    })

    const handleOnStatusToggle = (id, status) => {
        Inertia.patch(getRoute('exams.status.toggle', { id, status }), null, {
            onError: () => dispatch(actions.error({
                message: translatables.error
            })),
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.exams.update_status
            }))
        })
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleOnFilterSubmit(e)
    }

    const handleOnFilterSubmit = e => {
        e.preventDefault()

        get(getRoute('mypage.course.manage_class.exams', { id: courseId }))
    }

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.exams,
        text: translatables.confirm.exams.delete,
        submitUrl: ''
    })

    const handleOnDelete = id => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            submitUrl: getRoute('exams.delete', {id})
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = () => {
        Inertia.delete(dialog.submitUrl, {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.exams.delete
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })

        setDialog(dialog => ({ ...dialog, open: false }))
    }

    return (
        <>
            <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h5" children={translatables.title.exams} />
                </Grid>
                <Grid item xs={12} md="auto">
                    <Link href={getRoute('exams.create', { id: courseId })}>
                        <Button
                            variant="contained"
                            children={translatables.texts.create_exam}
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
                                    label={translatables.texts.keyword}
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label={translatables.texts.status}
                                    select
                                    InputLabelProps={{
                                        shrink: true
                                    }}
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
                                    InputLabelProps={{
                                        shrink: true
                                    }}
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
                                    onClick={handleOnFilterSubmit}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            {
                processing
                ? <TableLoader />
                : (
                    <ExamTable
                        handleOnStatusToggle={handleOnStatusToggle}
                        data={exams.data}
                        handleOnDelete={handleOnDelete}
                    />
                )
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={exams.last_page}
                    page={exams.current_page}
                    color="primary"
                />
            </Box>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogSubmit}
            />
        </>
    )
}

export default Exams
