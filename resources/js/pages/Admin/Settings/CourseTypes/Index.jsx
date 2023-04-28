import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { useState } from "react"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import routes from "../../../../helpers/routes.helper"
import { actions } from "../../../../store/slices/ToasterSlice"
import ConfirmationDialog from "../../../../components/common/ConfirmationDialog"

const Index = () => {

    const dispatch = useDispatch()

    const { title, types, errors, translatables } = usePage().props

    const [isUpdated, setIsUpdated] = useState(Object.keys(errors).length <= 0 ? false : true)

    const [dialog, setDialog] = useState({
        open: false,
        title: title,
        text: translatables.confirm.class.types.update
    })

    const { data, setData, patch, processing } = useForm('CourseTypeForm', { types })

    const handleOnChange = e => {

        const id = parseInt(e.target.getAttribute('id'))

        setData(data => ({
            ...data,
            types: {
                ...data.types,
                [id]: e.target.value
            }
        }))

        setIsUpdated(types[id] !== e.target.value)
    }

    const handleSubmit = e => {
        e.preventDefault()

        patch(routes["admin.settings.course_types.update"], {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.class.types.update
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
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

    const displayCourseTypes = () => Object.keys(data.types).map(index => (
        <TableRow key={index}>
            <TableCell>
                <Input
                    id={index}
                    name={`types.${index}`}
                    placeholder={translatables.texts.type}
                    value={data.types[index]}
                    onChange={handleOnChange}
                    errors={errors}
                    InputProps={{
                        readOnly: true,
                      }}
                />
            </TableCell>
        </TableRow>
    ))

    return (
        <Box>
            <ConfirmationDialog
                {...dialog}
                processing={processing}
                handleClose={handleOnDialogClose}
                handleConfirm={handleSubmit}
            />
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children={title}
                />
                {
                    isUpdated &&
                    <Button
                        children={translatables.texts.save_changes}
                        variant="contained"
                        onClick={handleOnSaveChanges}
                    />
                }
            </Stack>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell children={translatables.texts.class_type} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayCourseTypes()}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default Index
