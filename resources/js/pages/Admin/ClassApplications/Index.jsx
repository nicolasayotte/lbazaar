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

    const { courseApplications, categoryOptions, nftOptions, typeOptions, keyword, course_type, category, status, sort, page, translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.class.applications.index,
        text: '',
        url: '',
        confirmButtonText: 'Confirm',
        processing: false
    })

    const sortOptions = [
        { name: translatables.filters.title.asc, value: 'title:asc' },
        { name: translatables.filters.title.desc, value: 'title:desc' },
        { name: translatables.filters.price.asc, value: 'price:asc' },
        { name: translatables.filters.price.desc, value: 'price:desc' },
        { name: translatables.filters.date.asc, value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
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
            confirmButtonText: translatables.texts.processing,
            processing: true
        }))

        Inertia.patch(dialog.url, dialog, {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.class.applications.status.update
            })),
            onError: () => dispatch(actions.success({
                message: translatables.error
            }))
        })
    }

    return (
        <Box>
            <Typography
                variant="h4"
                children={translatables.title.class.applications.index}
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label={translatables.texts.keyword}
                                    placeholder={translatables.texts.search_title_teacher}
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    select
                                    label={translatables.texts.type}
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
                                    label={translatables.texts.category}
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
                                    label={translatables.texts.status}
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
            {
                processing
                ? <TableLoader />
                : <ClassApplicationTable data={courseApplications.data}/>
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
