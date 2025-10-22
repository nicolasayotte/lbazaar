import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Stack, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import routes from "../../../../helpers/routes.helper"
import { actions } from "../../../../store/slices/ToasterSlice"
import TranslationTable from "./components/TranslationTable"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"
import { useState } from "react"

const Index = () => {

    const dispatch = useDispatch()

    const { translations, translatables } = usePage().props

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.title.translations,
        text: translatables.confirm.translations.update,
    })

    const setInitialFormValues = () => {
        let values = new Array()

        translations.map(translation => {
            values[`${translation.key}`] = translation.ja
        })

        return values
    }

    const { data, setData, patch } = useForm({
        translations: setInitialFormValues()
    })

    const handleOnChange = (e, key) => {
        setData(data => ({
            translations: {
                ...data.translations,
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

        patch(routes["admin.settings.translations.update"], {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.translations.update
            }))
        })
    }

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children={translatables.title.translations}
                />
                {
                    translations && translations.length > 0 &&
                    <Button
                        children={translatables.texts.save_changes}
                        variant="contained"
                        onClick={handleOnSaveChanges}
                    />
                }
            </Stack>
            <TranslationTable
                data={translations}
                formData={data.translations}
                handleOnChange={handleOnChange}
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
