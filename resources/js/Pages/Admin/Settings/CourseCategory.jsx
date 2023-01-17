import { useForm, usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Grid, Pagination, Stack, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import CourseCategoryTable from "./components/CourseCategoryTable"
import TableLoader from "../../../components/common/TableLoader"
import { handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper"
import { useEffect, useState } from "react"
import FormDialog from "../../../components/common/FormDialog"
import { useDispatch } from "react-redux"
import { actions } from "../../../store/slices/ToasterSlice"
import { Inertia } from "@inertiajs/inertia"
import routes, { getRoute } from "../../../helpers/routes.helper"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"

const CourseCategory = () => {

    const dispatch = useDispatch()

    const sortOptions = [
        { name: 'Name A-Z', value: 'name:asc' },
        { name: 'Name Z-A', value: 'name:desc' },
        { name: 'Date - Oldest', value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const { categories, keyword, sort, page, errors, messages } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        value: '',
        submitUrl: '',
        method: null,
        processing: false,
        type: ''
    })

    // Filter form values
    const { data: filters, setData: setFilters, get: requestFilters, transform: transformFilters, processing: processingFilters, clearErrors } = useForm('CategoriesFilterForm',{
        keyword,
        sort,
        page
    })

    const handleFilterSubmit = e => {
        e.preventDefault()

        requestFilters(routes["admin.settings.categories.index"])
    }

    const handleOnPaginate = (e, page) => {
        transformFilters(data => ({
            ...data,
            page
        }))

        handleFilterSubmit(e)
    }

    const handleOnCreate = (value) => {

        // If the error message is from edit category, then delete
        if (errors.category_value !== undefined && errors.category_id !== undefined) {
            delete errors.name
        }

        setDialog(dialog => ({
            ...dialog,
            value: value ?? '',
            open: true,
            title: 'Create Category',
            submitUrl: routes["admin.settings.categories.store"],
            method: 'post',
            action: 'create'
        }))
    }

    const handleOnEdit = (id, value) => {

        // Check if editing the same category that has an error, then set value as the one previously submitted
        const inputValue = (errors.category_id !== undefined && errors.category_id == id) ? errors.category_value : value

        // Check if the selected category was the one that has an error, otherwise delete errors.name
        if (
            errors.category_id !== undefined && errors.category_id != id ||
            errors.category_value !== undefined && errors.category_id === undefined
        ) {
            delete errors.name
        }

        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: 'Edit Category',
            submitUrl: getRoute('admin.settings.categories.update', {id}),
            method: 'patch',
            action: 'update',
            value: inputValue
        }))
    }

    const handleOnDelete = id => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: 'Delete Category',
            text: messages.confirm.category.delete,
            submitUrl: getRoute('admin.settings.categories.delete', {id}),
            method: 'delete',
            action: 'delete'
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = (e) => {
        e.preventDefault()

        Inertia.visit(dialog.submitUrl, {
            method: dialog.method,
            data: {
                name: dialog.value
            },
            preserveState: true,
            onBefore: () => {
                setDialog(dialog => ({
                    ...dialog,
                    processing: true
                }))
            },
            onSuccess: () => dispatch(actions.success({
                message: messages.success.category[dialog.action]
            })),
            onError: () => {
                setDialog({
                    ...dialog,
                    open: true
                })
                dispatch(actions.error({
                    message: messages.error
                }))
            }
        })
    }

    const displayDialogs = () => {

        if (dialog.action === 'delete') {
            return (
                <ConfirmationDialog
                    {...dialog}
                    handleClose={handleOnDialogClose}
                    handleConfirm={handleOnDialogSubmit}
                />
            )
        }

        return (
            <FormDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleSubmit={handleOnDialogSubmit}
                processing={dialog.processing}
            >
                <Input
                    name="name"
                    value={dialog.value}
                    placeholder="e.g. Blockchain"
                    onChange={e => setDialog(dialog => ({
                        ...dialog,
                        value: e.target.value
                    }))}
                    errors={errors}
                />
            </FormDialog>
        )
    }

    useEffect(() => {
        // If errors on edit submit
        if (errors.name !== undefined && errors.category_id !== undefined) {
            handleOnEdit(errors.category_id, errors.category_value)
            return
        }

        // If errors on create submit
        if (errors.name !== undefined && errors.category_value !== undefined) {
            handleOnCreate(errors.category_value)
            return
        }
    }, [errors])

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children="Categories"
                />
                <Button
                    children="Create Category"
                    variant="contained"
                    startIcon={
                        <Add/>
                    }
                    onClick={e => handleOnCreate('')}
                />
            </Stack>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for name"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Input
                                    label="Sort"
                                    select
                                    name="sort"
                                    value={filters.sort}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                    onChange={e => handleOnSelectChange(e, filters, transformFilters, handleFilterSubmit)}
                                >
                                    {displaySelectOptions(sortOptions, 'value')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button
                                    children="Filter"
                                    variant="contained"
                                    fullWidth
                                />
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            {
                processingFilters
                ? <TableLoader />
                : <CourseCategoryTable data={categories.data} handleOnEdit={handleOnEdit} handleOnDelete={handleOnDelete}/>
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={categories.last_page}
                    page={categories.current_page}
                    color="primary"
                />
            </Box>
            {displayDialogs()}
        </Box>
    )
}

export default CourseCategory
