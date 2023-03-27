import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Menu, MenuItem, Pagination, Typography } from "@mui/material"
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

const Index = () => {

    const dispatch = useDispatch()

    const { users, roleOptions, statusOptions, status, keyword, role, sort, translatables, page, export_type, export_options } = usePage().props

    const [showExportDropdown, setShowExportDropdown] = useState(null)

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.users.index,
        text: '',
        url: ''
    })

    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        status,
        role,
        sort,
        page,
        export_type,
    })

    const sortOptions = [
        { name: translatables.filters.name.asc, value: 'first_name:asc' },
        { name: translatables.filters.name.desc, value: 'first_name:desc' },
        { name: translatables.filters.date.asc,  value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
    ]

    const handleFilterSubmit = e => {
        e.preventDefault()

        if (e.target.value == 'export') {
            get(routes["admin.users.export"], {
                data: filters
            })
        } else {
            get(routes["admin.users.index"], {
                data: filters
            })
        }
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
            text: translatables.confirm.user.enable,
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
            text: translatables.confirm.user.disable,
            url: getRoute('admin.users.status.update', {
                id: id,
                status: 'disabled'
            })
        }))
    }

    // Dialog close handler
    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    // Dialog confirm handler
    const handleOnDialogConfirm = () => {
        Inertia.post(dialog.url, dialog, {
            onSuccess: () => {
                setDialog({ open: false })

                dispatch(actions.success({
                    message: translatables.success.user.status.update
                }))
            },
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    const handleOnShowExportDropdown = e => {
        setShowExportDropdown(e.currentTarget)
    }

    const handleOnCloseExportDropdown = () => {
        setShowExportDropdown(null)
    }

    const exportButton = () => {

        const MenuItems = () => export_options && export_options.map((exportOption, index) => (
            <MenuItem key={index}>
                <a
                    href={`${routes["admin.users.export"]}?export_type=${exportOption.id}`}
                    children={exportOption.name}
                />
            </MenuItem>
        ))

        return (
            <>
                <Button
                    size="large"
                    variant="contained"
                    children={translatables.texts.export_csv}
                    onClick={handleOnShowExportDropdown}
                />
                <Menu
                    anchorEl={showExportDropdown}
                    open={Boolean(showExportDropdown)}
                    onClose={handleOnCloseExportDropdown}
                >
                    <MenuItems />
                </Menu>
            </>
        )
    }

    return (
        <Box>
            <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }} spacing={2}>
                <Grid item xs={12} md="auto">
                    <Typography
                        variant="h4"
                        children={translatables.title.users.index}
                    />
                </Grid>
                <Grid item xs={12} md="auto">
                    { exportButton() }
                </Grid>
            </Grid>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
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
                                    label={translatables.texts.role}
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
                                    label={translatables.texts.status}
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
                                    label={translatables.texts.sort}
                                    select
                                    name="sort"
                                    value={filters.sort}
                                    children={displaySelectOptions(sortOptions, 'value', 'name')}
                                    onChange={e => handleOnSelectChange(e, filters, transform, handleFilterSubmit)}
                                />
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    children={translatables.texts.filter}
                                    value="filter"
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
                : <UserTable
                    data={users.data}
                    handleOnEnable={handleOnEnable}
                    handleOnDisable={handleOnDisable}
                    export_options={export_options}
                    export_type={export_type}
                    />
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
