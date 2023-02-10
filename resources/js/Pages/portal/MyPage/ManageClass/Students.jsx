import { useForm, usePage } from "@inertiajs/inertia-react"
import { Card, CardContent, Grid, Box, Pagination, Button } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import {getRoute} from "../../../../helpers/routes.helper"
import TableLoader from "../../../../components/common/TableLoader"
import ManageClassTabs from "./components/ManageClassTabs"
import ClassStudentsTable from "./components/ClassStudentsTable"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"
import { useDispatch } from "react-redux"
import { useState } from "react"
import { Inertia } from "@inertiajs/inertia"

const Details = () => {

    const dispatch = useDispatch()

    const { courseId, students, tabValue, keyword, sort, page, messages } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: 'Student Course Status',
        text: '',
        url: ''
    })
    const { data: filters, setData: setFilters, get, transform, processing } = useForm({
        keyword,
        sort,
        page
    })

    const sortOptions = [
        { name: 'Name A-Z', value: 'users.first_name:asc' },
        { name: 'Name Z-A', value: 'users.first_name:desc' },
        { name: 'Date - Oldest',  value: 'course_histories.created_at:asc' },
        { name: 'Date - Newest', value: 'course_histories.created_at:desc' }
    ]

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(getRoute('mypage.course.manage_class.students', { id: courseId}))
    }

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            ...filters,
            page
        }))

        handleFilterSubmit(e)
    }

     // complete button click handler
     const handleOnComplete = (id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            text: messages.confirm.classComplete.complete,
            url: getRoute('mypage.course.manage_class.students.update.complete.status', {
                id: id,

                status: 'Completed'
            })
        }))
    }

    // unfinished button click handler
    const handleOnOngoing = (id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            text: messages.confirm.classComplete.ongoing,
            url: getRoute('mypage.course.manage_class.students.update.complete.status', {
                id: id,
                status: 'Ongoing'
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
                    message: messages.success.user.status.update
                }))
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }


    return (
        <>
            <Grid item xs={12}>
                <ManageClassTabs tabValue={tabValue} id={courseId}/>
            </Grid>
            <Grid item xs={12} sx={{mb: 2}}>
                <Card sx={{ mb: 2 }}>
                    <CardContent>
                        <form onSubmit={handleFilterSubmit}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Input
                                        label="Keyword"
                                        placeholder="Search for name or email"
                                        name="keyword"
                                        value={filters.keyword}
                                        onChange={e => handleOnChange(e, setFilters)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
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
                                <Grid item xs={12} md={2} textAlign="right">
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
                    : <ClassStudentsTable data={students.data} handleOnComplete={handleOnComplete} handleOnOngoing={handleOnOngoing}/>
                }
                <Grid item xs={12} md={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <Pagination
                            onChange={handleOnPaginate}
                            count={students.last_page}
                            page={students.current_page}
                            color="primary"
                        />
                    </Box>
                </Grid>
            </Grid>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogConfirm}
            />
        </>
    )
}

export default Details
