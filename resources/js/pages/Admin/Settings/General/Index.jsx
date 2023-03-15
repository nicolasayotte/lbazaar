import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Stack, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import routes from "../../../../helpers/routes.helper"
import { actions } from "../../../../store/slices/ToasterSlice"
import GeneralSettingsTable from "./components/GeneralSettingsTable"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"
import { useState } from "react"

const Index = (errors) => {
    const dispatch = useDispatch()

    const { general_settings, translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.translations,
        text: translatables.confirm.settings.update,
    })

    const setInitialFormValues = () => {
        let values = new Array()

        general_settings.map(general_setting => {
            values[`${general_setting.slug}`] = general_setting.value
        })

        return values
    }

    const { data, setData, post } = useForm({
        general_settings: setInitialFormValues()
    })

    const handleOnChange = (e, key) => {
        setData(data => ({
            general_settings: {
                ...data.general_settings,
                [key]: e.target.value
            }
        }))
    }

    const handleOnSaveChanges = e => {
        setDialog(dialog => ({
            ...dialog,
            open: true
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogConfirm = e => {
        e.preventDefault()

        post(routes["admin.settings.general.update"], {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.update
            }))
        })
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children={translatables.title.general}
                />
                {
                    general_settings && general_settings.length > 0 &&
                    <Button
                        children={translatables.texts.save_changes}
                        variant="contained"
                        onClick={handleOnSaveChanges}
                    />
                }
            </Stack>
            <GeneralSettingsTable
                data={general_settings}
                formData={data.general_settings}
                handleOnChange={handleOnChange}
                translatables={translatables}
                errors={errors.errors}
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
