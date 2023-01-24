import { useForm, usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Stack, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import ClassificationTable from "./components/ClassificationTable"
import routes, { getRoute } from "../../../../helpers/routes.helper"
import { useDispatch } from "react-redux"
import { actions } from "../../../../store/slices/ToasterSlice"
import { Inertia } from "@inertiajs/inertia"
import Dialogs from "./components/Dialogs"
import Input from "../../../../components/forms/Input"
import { handleOnChange } from "../../../../helpers/form.helper"

const Index = () => {

    const dispatch = useDispatch()

    const { classifications, messages, errors } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        method: '',
        title: '',
        text: '',
        submitUrl: '',
        deleteIndex: null
    })

    const { data, setData } = useForm('ClassificationForm', {
        name: '',
        commision_rate: ''
    })

    const handleOnCreate = (name = '', commision_rate = '') => {

        setData(data => ({
            ...data,
            name,
            commision_rate
        }))

        setDialog(dialog => ({
            ...dialog,
            title: 'Create Classification',
            open: true,
            method: 'post',
            action: 'create',
            submitUrl: routes["admin.settings.classifications.store"]
        }))
    }

    const handleOnDeleteRow = (id, index) => {
        let submitUrl = id === '' ? '' : getRoute('admin.settings.classifications.delete', { id })

        let deleteIndex = id === '' ? index : ''

        setDialog(dialog => ({
            ...dialog,
            title: 'Delete Classification',
            method: 'delete',
            action: 'delete',
            open: true,
            text: messages.confirm.classification.delete,
            deleteIndex,
            submitUrl
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = e => {
        e.preventDefault()

        Inertia.visit(dialog.submitUrl, {
            method: dialog.method,
            data: {
                ...data,
                action: dialog.action
            },
            onSuccess: () => dispatch(actions.success({
                message: messages.success.classification[dialog.action]
            })),
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    const dialogFormInputs = (
        <>
            <Box mb={2}>
                <Input
                    placeholder="Classification name"
                    name="name"
                    value={data.name}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Box>
            <Input
                type="number"
                placeholder="Commission rate (%)"
                name="commision_rate"
                value={data.commision_rate}
                onChange={e => handleOnChange(e, setData)}
                errors={errors}
                inputProps={{
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                    min: 1,
                    max: 100
                }}
            />
        </>
    )

    useEffect(() => {
        // If errors on create submit
        if (errors.create && Object.keys(errors.create).length > 0) {
            const { name, commision_rate } = errors.create

            handleOnCreate(name || '', commision_rate || '')

            return
        }
    }, [errors])

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
                    onClick={() => handleOnCreate('', '')}
                />
            </Stack>
            <ClassificationTable
                data={classifications}
                handleOnDeleteRow={handleOnDeleteRow}
            />
            <Dialogs
                dialog={dialog}
                handleClose={handleOnDialogClose}
                handleSubmit={handleOnDialogSubmit}
                inputs={dialogFormInputs}
            />
        </Box>
    )
}

export default Index
