import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper"
import ClassApplicationTable from "./components/ClassApplicationTable"
import routes from "../../../helpers/routes.helper"
import TableLoader from "../../../components/common/TableLoader"
import { useState } from "react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { useDispatch } from "react-redux"
import { actions } from "../../../store/slices/ToasterSlice"

const Index = () => {

    const dispatch = useDispatch()

    const { courseApplications, categoryOptions, typeOptions, keyword, course_type, category, status, sort, page, messages } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: 'Class Application',
        text: '',
        url: '',
        confirmButtonText: 'Confirm',
        processing: false
    })

    const sortOptions = [
        { name: 'Title A-Z', value: 'title:asc' },
        { name: 'Title Z-A', value: 'title:desc' },
        { name: 'Price - Low to High', value: 'price:asc' },
        { name: 'Price - High to Low', value: 'price:desc' },
        { name: 'Date - Oldest', value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const statusOptions = [
        { name: 'Pending', value: 'pending' },
        { name: 'Denied', value: 'denied' },
        { name: 'Approved', value: 'approved' }
    ]

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        course_type,
        category,
        status,
        sort,
        page
    })

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["admin.class.applications.index"])
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleFilterSubmit(e)
    }

    const handleOnApprove = (id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            text: messages.confirm.class.applications.approve,
            url: getRoute('admin.class.applications.status.update', {
                id,
                status: 'approve'
            })
        }))
    }

    const handleOnDeny = (id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            text: messages.confirm.class.applications.deny,
            url: getRoute('admin.class.applications.status.update', {
                id,
                status: 'deny'
            })
        }))
    }

    const handleOnDialogClose = () => {

        if (dialog.processing) {
            return
        }

        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogConfirm = () => {
        setDialog(dialog => ({
            ...dialog,
            confirmButtonText: 'Processing',
            processing: true
        }))

        Inertia.patch(dialog.url, dialog, {
            onSuccess: () => dispatch(actions.success({
                message: messages.success.class.applications.status.update
            })),
            onError: () => dispatch(actions.success({
                message: messages.error
            }))
        })
    }

    return (
        <Box>
            <Typography
                variant="h4"
                children="Class Applications"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for title or teacher"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Type"
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
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Category"
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
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label="Status"
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    name="status"
                                    value={filters.status}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(statusOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
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
                            <Grid item xs={12} md={1} textAlign="right">
                                <Button
                                    children="Filter"
                                    variant="contained"
                                    fullWidth
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
                : <ClassApplicationTable data={courseApplications.data} handleOnApprove={handleOnApprove} handleOnDeny={handleOnDeny}/>
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={courseApplications.last_page}
                    page={courseApplications.current_page}
                    color="primary"
                />
            </Box>
            <ConfirmationDialog
                {...dialog}
                handleConfirm={handleOnDialogConfirm}
                handleClose={handleOnDialogClose}
            />
        </Box>
    )
}

export default Index
