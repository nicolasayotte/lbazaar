import { useForm } from "@inertiajs/inertia-react"
import { IconButton, Button, Card, CardContent, Stack, Grid, Typography, Alert, AlertTitle, Box } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleEditorOnChange } from "../../../../../helpers/form.helper"
import { actions } from "../../../../../store/slices/ToasterSlice"
import TextEditorInput from "../../../../../components/forms/TextEditorInput"
import { useEffect, useState } from "react"
import { ContentCopy } from '@mui/icons-material';
import BackButton from "../../../../../components/common/BackButton"


const ClassApplicationForm = ({ errors, auth, messages, routes, categoryOptions, typeOptions, command }) => {

    const dispatch = useDispatch()

    const [isEarned, setIsEarned] = useState(false);

    const [isPaidClass, setIsPaidClass] = useState(false);

    const [disabledForm, setDisabledForm] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        course_category_id: '',
        course_type_id: '',
        price: '',
        price_earned: '',
        title: '',
        description: '',
        language: '',
        seats: '',
        lecture_type: '',
    })

    const languageOption = [
        { name: 'English', value: 'English' },
        { name: 'Japanese', value: 'Japanese' }
    ]

    const lectureTypeOption = [
        { name: 'Live', value: 'Live' },
        { name: 'On-demand', value: 'On-demand' }
    ]

    const handleSubmit = e => {
        e.preventDefault()

        post(routes["mypage.course.applications.generate"], {
            preserveScroll: true,
            onSuccess: (response) => {
                setDisabledForm(true)
                dispatch(actions.success({
                    message: messages.success.class_generated
                }))
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    const displayCommand = () => {
        if (command != null) {
            return (
                <Alert severity="success" sx={{ position: 'relative' }}>
                    <AlertTitle>Copy the generated command</AlertTitle>
                    <strong>{command}</strong>
                    <IconButton onClick={handleCopyCommand} color="white" sx={{ position: 'absolute', right: '0' }}>
                        <ContentCopy fontSize="small" color="inherit" />
                    </IconButton>
                </Alert>
            )
        }
    }

    const handleOnTypeChange = (e) => {

        const input = e.target

        const isEarned = input.selectedIndex === 3

        const isPaidClass = input.selectedIndex === 1 || input.selectedIndex === 4

        if (isEarned) {
            setIsEarned(true)
            setIsPaidClass(false)
        } else if (isPaidClass) {
            setIsPaidClass(true)
            setIsEarned(false)
        } else {
            setIsEarned(false)
            setIsPaidClass(false)

            setData(data => ({
                ...data,
                price_earned: 0,
                price: 0
            }))
        }

        setData(data => ({
            ...data,
            [e.target.name]: e.target.value
        }))
    }

    const typeInput = document.getElementById('course_type')

    const handleCopyCommand = () => {
        navigator.clipboard.writeText(command)

        dispatch(actions.success({
            message: messages.success.copy
        }))
    }

    useEffect(() => {
        if (typeInput && typeInput.selectedIndex === 3) {
            setIsEarned(true)
            setIsPaidClass(true)
        }

        if (typeInput && (typeInput.selectedIndex === 1 || typeInput.selectedIndex === 4)) {
            setIsPaidClass(true)
            setIsEarned(false)
        }
    }, [typeInput])

    const displayFormLayout = () => {
        return (
            <Box>
                <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>Create Class Application</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={12}>
                        <Input
                            label="Title"
                            name="title"
                            value={data.title}
                            onChange={e => handleOnChange(e, setData)}
                            errors={errors}
                            disabled={disabledForm}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Input
                            select
                            label="Type"
                            InputLabelProps={{
                                shrink: true
                            }}
                            id="course_type"
                            name="course_type_id"
                            value={data.course_type_id}
                            onChange={e => handleOnTypeChange(e)}
                            errors={errors}
                            disabled={disabledForm}
                        >
                            <option value=""></option>
                            {displaySelectOptions(typeOptions)}
                        </Input>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Input
                            select
                            label="Category"
                            InputLabelProps={{
                                shrink: true
                            }}
                            name="course_category_id"
                            value={data.course_category_id}
                            onChange={e => handleOnChange(e, setData)}
                            errors={errors}
                            disabled={disabledForm}
                        >
                            <option value=""></option>
                            {displaySelectOptions(categoryOptions)}
                        </Input>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Input
                            select
                            label="Language"
                            InputLabelProps={{
                                shrink: true
                            }}
                            name="language"
                            value={data.language}
                            onChange={e => handleOnChange(e, setData)}
                            errors={errors}
                            disabled={disabledForm}
                        >
                            <option value=""></option>
                            {displaySelectOptions(languageOption)}
                        </Input>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Input
                            select
                            label="Lecture Type"
                            InputLabelProps={{
                                shrink: true
                            }}
                            name="lecture_type"
                            value={data.lecture_type}
                            onChange={e => handleOnChange(e, setData)}
                            errors={errors}
                            disabled={disabledForm}
                        >
                            <option value=""></option>
                            {displaySelectOptions(lectureTypeOption)}
                        </Input>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Input
                            label="Seats"
                            name="seats"
                            InputLabelProps={{
                                shrink: true
                            }}
                            value={data.seats}
                            onChange={e => handleOnChange(e, setData)}
                            errors={errors}
                            disabled={disabledForm}
                        />
                    </Grid>
                    {
                        (isPaidClass) &&
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Price"
                                name="price"
                                InputLabelProps={{
                                    shrink: true
                                }}
                                value={data.price}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                                disabled={disabledForm}
                            />
                        </Grid>
                    }
                    {
                        (isEarned) &&
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Price earned"
                                name="price_earned"
                                InputLabelProps={{
                                    shrink: true
                                }}
                                value={data.price_earned}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                                disabled={disabledForm}
                            />
                        </Grid>
                    }
                    <Grid item xs={12} sm={12} sx={{ mb: 2 }}>
                        <Typography variant="h6">Description</Typography>
                        <TextEditorInput
                            name="description"
                            value={data.description}
                            onChange={(value) => handleEditorOnChange(value, setData, 'description')}
                            style={{ height: '180px' }}
                            errors={errors}
                            readOnly={disabledForm}
                        />
                    </Grid>
                </Grid>
            </Box>
        )
    }

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                {displayCommand()}
                <CardContent sx={{ p: 4 }}>
                    {displayFormLayout()}
                    <Grid item xs={12} md={12} textAlign="right">
                        <Stack direction="row" spacing={1} justifyContent="end">
                            <BackButton processing={processing} />
                            {
                                (disabledForm) &&
                                <Button
                                    type="submit"
                                    variant="contained"
                                    onClick={() => setDisabledForm(false)}
                                    disabled={processing}
                                >Edit Form</Button>
                            }
                            {
                                (!disabledForm) &&
                                <Button
                                    type="submit"
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >Generate</Button>
                            }
                        </Stack>
                    </Grid>
                </CardContent>
            </form>
        </Card>
    )
}

export default ClassApplicationForm
