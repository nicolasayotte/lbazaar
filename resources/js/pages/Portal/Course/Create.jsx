import { Box, Breadcrumbs, Button, Card, CardContent, Container, FormControlLabel, Grid, Switch, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import TextEditorInput from "../../../components/forms/TextEditorInput"
import { Stack } from "@mui/system"
import FileInput from "../../../components/forms/CustomFileInput"
import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import routes, { getRoute } from "../../../helpers/routes.helper"
import { displaySelectOptions, handleOnChange } from "../../../helpers/form.helper"
import { useState } from "react"

const Create = () => {

    const { courseApplication, translatables, categories, course } = usePage().props

    const formatOptions = [
        { name: 'Live', value: 'live' },
        { name: 'On-Demand', value: 'on-demand' }
    ]

    const initialData = course || courseApplication

    const title = course ? translatables.texts.edit_class : translatables.title.class.create

    const { data, setData, post, errors } = useForm(course ? `EditClassForm:${course.id}` : 'CreateClassForm', {
        ...initialData,
        format: (course && course.is_live !== undefined) ? (course.is_live ? 'live' : 'on-demand') : 'on-demand',
        image_thumbnail: course && course.image_thumbnail ? course.image_thumbnail : '',
        video_path: course && course.video_path ? course.video_path : '',
        is_cancellable: course && course.is_cancellable && course.is_cancellable > 0 ? true : false,
        days_before_cancellation: course && course.days_before_cancellation ? course.days_before_cancellation : 1,
    })

    const [imgPreview, setImgPreview] = useState(course && course.image_thumbnail ? course.image_thumbnail : null)

    const [videoPreview, setVideoPreview] = useState(course && course.video_path ? course.video_path : null)

    const cancelRoute = course !== undefined
    ? getRoute('mypage.course.manage_class.schedules', { id: course.id })
    : routes["mypage.course.applications.index"]

    const handleOnCancellableChange = e => {
        setData(data => ({
            ...data,
            is_cancellable: !data.is_cancellable
        }))
    }

    const handleOnFileUpload = (e, setPreviewMethod) => {
        const uploadedFile = e.target.files[0]

        if (uploadedFile) {
            setPreviewMethod(URL.createObjectURL(uploadedFile))
            setData(data => ({
                ...data,
                [e.target.name]: uploadedFile
            }))
        }
    }

    const handleOnFormSubmit = e => {
        e.preventDefault()

        const submitUrl = course
        ? getRoute('course.update', { id: course.id })
        : getRoute('course.store', { id: courseApplication.id })

        post(submitUrl)
    }

    return (
        <form onSubmit={handleOnFormSubmit}>
            <Container sx={{ mt: 4 }}>
                <Grid container spacing={2}>
                    <Grid item container xs={12} alignItems="center" spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="h4" children={title} />
                            <Breadcrumbs>
                                <Link href={routes["mypage.course.applications.index"]} children={translatables.title.class.applications.index} />
                                <Typography color="text.primary" children={title} />
                            </Breadcrumbs>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Stack direction={{ xs: 'column-reverse', md: 'row' }} spacing={2} justifyContent="end">
                                <Link href={cancelRoute} style={{ width: '100%' }}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        children={translatables.texts.cancel}
                                        fullWidth
                                    />
                                </Link>
                                <Button
                                    type="submit"
                                    size="large"
                                    variant="contained"
                                    children={translatables.texts.submit}
                                    fullWidth
                                    onClick={handleOnFormSubmit}
                                />
                            </Stack>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography children={translatables.texts.general_information} gutterBottom />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.title}
                                            name="title"
                                            value={data.title}
                                            onChange={e => handleOnChange(e, setData)}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextEditorInput
                                            name="description"
                                            value={data.description}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            select
                                            label={translatables.texts.category}
                                            name="course_category_id"
                                            value={data.course_category_id}
                                            onChange={e => handleOnChange(e, setData)}
                                            children={displaySelectOptions(categories)}
                                            errors={errors}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography children={translatables.texts.content_information} gutterBottom />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            select
                                            label={translatables.texts.format}
                                            name="format"
                                            value={data.format}
                                            onChange={e => handleOnChange(e, setData)}
                                            children={displaySelectOptions(formatOptions, 'value')}
                                        />
                                    </Grid>
                                    {
                                        data && data.format === 'live' &&
                                        <Grid item xs={12}>
                                            <Input
                                                label={translatables.texts.zoom_link}
                                                name="zoom_link"
                                                value={data.zoom_link}
                                                onChange={e => handleOnChange(e, setData)}
                                                errors={errors}
                                            />
                                        </Grid>
                                    }
                                    {
                                        data && data.format === 'on-demand' &&
                                        <Grid item xs={12}>
                                            <FileInput
                                                name="video_path"
                                                value={data.video_path}
                                                accepts="video"
                                                placeholderImageHeight="300px"
                                                src={videoPreview}
                                                onChange={e => handleOnFileUpload(e, setVideoPreview)}
                                                errors={errors}
                                            />
                                        </Grid>
                                    }
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography children={translatables.texts.class_information} gutterBottom />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.type}
                                            value={data.course_type.name}
                                            inputProps={{ readOnly: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.seats}
                                            value={data.max_participant}
                                            inputProps={{ readOnly: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    name="is_cancellable"
                                                    checked={is_cancellable}
                                                    onChange={handleOnCancellableChange}
                                                    sx={{ ml: 'auto' }}
                                                />
                                            }
                                            label="Cancellable"
                                            labelPlacement="start"
                                            sx={{
                                                mx: 0,
                                                width: '100%'
                                            }}
                                        />
                                    </Grid>
                                    {
                                        data.is_cancellable &&
                                        <Grid item xs={12}>
                                            <Input
                                                type="number"
                                                label={translatables.texts.days}
                                                helperText={translatables.texts.days_before_cancellation}
                                                name="days_before_cancellation"
                                                value={data.days_before_cancellation}
                                                inputProps={{ min: 1 }}
                                                onChange={e => handleOnChange(e, setData)}
                                                errors={errors}
                                            />
                                        </Grid>
                                    }
                                </Grid>
                            </CardContent>
                        </Card>
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography children={translatables.texts.pricing_information} gutterBottom />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.price}
                                            value={data.price ? data.price.toFixed(2) : '0.00'}
                                            inputProps={{ readOnly: true }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.points_earned}
                                            value={data.points_earned ? data.points_earned.toFixed(2) : '0.00'}
                                            inputProps={{ readOnly: true }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent>
                                <Typography children={translatables.texts.class_image} />
                                <Box sx={{ mt: 2 }}>
                                    <FileInput
                                        name="image_thumbnail"
                                        value={data.image_thumbnail}
                                        helperText={`${translatables.texts.recommended_size}: 800x600`}
                                        onChange={e => handleOnFileUpload(e, setImgPreview)}
                                        src={imgPreview}
                                        errors={errors}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </form>
    )
}

export default Create
