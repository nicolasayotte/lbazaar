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
import { Inertia } from "@inertiajs/inertia"

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

    const classificationBlueprint = {
        id: '',
        name: '',
        commision_rate: ''
    }

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

    const handleOnDialogConfirm = () => {

        Inertia.delete(dialog.submitUrl, {
            preserveState: true,
            onSuccess: () => dispatch(actions.success({
                message: messages.success.classification.delete
            })),
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
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
                    children="Create Classification"
                    variant="contained"
                    startIcon={<Add />}
                />
            </Stack>
            <ClassificationTable
                data={classifications}
                handleOnDeleteRow={handleOnDeleteRow}
            />
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogConfirm}
            />
        </Box>
    )
}

export default Index
