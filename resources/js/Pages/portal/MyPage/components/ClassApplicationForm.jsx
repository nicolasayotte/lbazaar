import { useForm, Link } from "@inertiajs/inertia-react"
import { Button, Card, CardContent, Stack, Grid, Typography, Alert, AlertTitle } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleEditorOnChange } from "../../../../helpers/form.helper"
import { actions } from "../../../../store/slices/ToasterSlice"
import TextEditorInput from "../../../../components/forms/TextEditorInput"

const ClassApplicationForm = ({ errors, auth, messages, routes, categoryOptions, typeOptions, command }) => {

    const dispatch = useDispatch()

    const { data, setData, post, processing, reset } = useForm({
        course_category_id: '',
        course_type_id: '',
        price: '',
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
                dispatch(actions.success({
                    message: messages.success.class_generated
                }))
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    const getQuery = (q) => {
        return (window.location.search.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
    }

    const displayCommand = () => {
        if (command != null) {
            return (
                <Alert severity="success">
                    <AlertTitle>Copy the generated command</AlertTitle>
                    <strong>{command}</strong>
                </Alert>
            )
        }
    }

    return (
        <Card>
            <form onSubmit={handleSubmit}>
                {displayCommand()}
                <CardContent sx={{ p: 4 }}>
                    <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>Create Class Application</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={12}>
                            <Input
                                label="Title"
                                name="title"
                                value={data.title}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                select
                                label="Type"
                                InputLabelProps={{
                                    shrink: true
                                }}
                                name="course_type_id"
                                value={data.course_type_id}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
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
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Price"
                                name="price"
                                value={data.price}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} sm={12}>
                            <Typography variant="h6">Description</Typography>
                            <TextEditorInput
                                name="description"
                                value={data.description}
                                onChange={(value) => handleEditorOnChange(value, setData, 'description')}
                                style={{height: '200px'}}
                                errors={errors}
                                />
                        </Grid>
                        <Grid item xs={12} textAlign="right">
                            <Stack direction="row" spacing={1} justifyContent="end">
                                <Link href={getQuery('returnUrl')}>
                                    <Button
                                        disabled={processing}
                                    >Back</Button>
                                </Link>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >Update</Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </form>
        </Card>
    )
}

export default ClassApplicationForm
