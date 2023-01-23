import { useForm, usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Stack, Typography } from "@mui/material"
import { useState } from "react"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"
import ClassificationTable from "./components/ClassificationTable"
import { getRoute } from "../../../../helpers/routes.helper"
import { useDispatch } from "react-redux"
import { actions } from "../../../../store/slices/ToasterSlice"
import TableLoader from "../../../../components/common/TableLoader"

const Index = () => {

    const dispatch = useDispatch()

    const { classifications, messages } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        submitUrl: '',
        deleteIndex: null
    })

    const { data, setData, transform, delete: deleteRequest } = useForm('ClassificationForm', {
        classifications
    })

    const handleOnDeleteRow = (id, index) => {
        let submitUrl = id === '' ? '' : getRoute('admin.settings.classifications.delete', { id })

        let deleteIndex = id === '' ? index : ''

        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: 'Delete Classification',
            text: messages.confirm.classification.delete,
            deleteIndex,
            submitUrl
        }))
    }

    const handleOnDialogConfirm = e => {
        e.preventDefault()

        const successHandler = () => {
            // Remove classification from list by index
            setData('classifications', data.classifications.filter((value, index) => index !== dialog.deleteIndex))

            if (dialog.deleteIndex !== '') {
                setDialog(dialog => ({
                    ...dialog,
                    open: false
                }))
            }

            dispatch(actions.success({
                message: messages.success.classification.delete
            }))

            return
        }

        if (dialog.submitUrl !== '') {
            deleteRequest(dialog.submitUrl, {
                onSuccess: successHandler,
                onError: () => dispatch(actions.error({
                    message: messages.error
                }))
            })

            return
        }
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children="Classifications"
                />
                <Button
                    children="Save Changes"
                    variant="contained"
                />
            </Stack>
            <ClassificationTable
                data={classifications}
                handleOnDeleteRow={handleOnDeleteRow}
            />
            <Box textAlign="center" sx={{ mt: 2 }}>
                <Button
                    children="Add row"
                    variant="outlined"
                    startIcon={<Add />}
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
