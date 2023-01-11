import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../helpers/form.helper"
import UserTable from "./components/UserTable"
import routes from "../../../helpers/routes.helper"
import TableLoader from "../../../components/common/TableLoader"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { useState } from "react"
import { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { useDispatch } from "react-redux"
import { actions } from "../../../store/slices/ToasterSlice"
import { PersonAdd } from "@mui/icons-material"

const Index = () => {

    const dispatch = useDispatch()

    const { users, roleOptions, statusOptions, status, keyword, role, sort, messages, page } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        url: ''
    })

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        status,
        role,
        sort,
        page
    })

    const sortOptions = [
        { name: 'Name A-Z', value: 'first_name:asc' },
        { name: 'Name Z-A', value: 'first_name:desc' },
        { name: 'Date - Oldest',  value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const handleFilterSubmit = e => {
        e.preventDefault()

        get(routes["admin.users.index"], {
            data: filters
        })
    }

    const handleOnPaginate = (e, page) => {
        transform(data => ({
            ...data,
            page
        }))

        handleFilterSubmit(e)
    }

    // Enable button click handler
    const handleOnEnable = (id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: 'Enable User',
            text: 'Are you sure you want to enable this user?',
            url: getRoute('admin.users.status.update', {
                id: id,
                status: 'active'
            })
        }))
    }

    // Disable button click handler
    const handleOnDisable = (id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: 'Disable User',
            text: 'Are you sure you want to disable this user?',
            url: getRoute('admin.users.status.update', {
                id: id,
                status: 'disabled'
            })
        }))
    }

    // Dialog close handler
    const handleOnDialogClose = () => {
        setDialog({ open: false })
    }

    // Dialog confirm handler
    const handleOnDialogConfirm = () => {
        Inertia.post(dialog.url, dialog, {
            onSuccess: () => {
                setDialog({ open: false })

                dispatch(actions.success({
                    message: messages.success.user.status.update
                }))
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    return (
        <Box>
            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                    <Typography
                        variant="h4"
                        children="Manage Users"
                    />
                </Grid>
                <Grid item xs={12} md={6} textAlign="right">
                    <Link href={routes["admin.users.create"]}>
                        <Button
                            variant="contained"
                            children="Create User"
                            startIcon={
                                <PersonAdd />
                            }
                        />
                    </Link>
                </Grid>
            </Grid>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={5}>
                                <Input
                                    label="Keyword"
                                    placeholder="Search for name or email"
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => handleOnChange(e, setFilters)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Role"
                                    select
                                    name="role"
                                    value={filters.role}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(roleOptions, 'value', 'name')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Status"
                                    select
                                    name="status"
                                    value={filters.status}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                    InputLabelProps={{
                                        shrink: true
                                    }}
                                >
                                    <option value="">All</option>
                                    {displaySelectOptions(statusOptions, 'value', 'name')}
                                </Input>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Input
                                    label="Sort"
                                    select
                                    name="sort"
                                    value={filters.sort}
                                    children={displaySelectOptions(sortOptions, 'value', 'name')}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                />
                            </Grid>
                            <Grid item xs={12} md={1}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    children="Filter"
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
                : <UserTable data={users.data} handleOnEnable={handleOnEnable} handleOnDisable={handleOnDisable} />
            }
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <Pagination
                    onChange={handleOnPaginate}
                    count={users.last_page}
                    page={users.current_page}
                    color="primary"
                />
            </Box>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogConfirm}
            />
        </Box>
    )
}

export default Index
