import { Autocomplete, Box, Breadcrumbs, Button, Card, CardContent, Container, FormControlLabel, Grid, Switch, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import TextEditorInput from "../../../components/forms/TextEditorInput"
import { Stack } from "@mui/system"
import FileInput from "../../../components/forms/CustomFileInput"
import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import routes, { getRoute } from "../../../helpers/routes.helper"
import { displaySelectOptions, handleEditorOnChange, handleOnChange } from "../../../helpers/form.helper"
import { useState } from "react"
import FormDialog from "../../../components/common/FormDialog"
import { Inertia } from "@inertiajs/inertia"

const Create = () => {

    const { courseApplication, translatables, categories, nft, course, packages } = usePage().props

    const formatOptions = {
        'live': 'Live',
        'on-demand': 'On-Demand'
    }

    const cancelRoute = course !== undefined
    ? getRoute('mypage.course.manage_class.schedules', { id: course.id })
    : routes["mypage.course.applications.index"]

    const initialData = course || courseApplication

    const title = course ? translatables.texts.edit_class : translatables.title.class.create

    const { data, setData, post, errors } = useForm(course ? `EditClassForm:${course.id}` : 'CreateClassForm', {
        ...initialData,
        format: (initialData && initialData.is_live !== undefined) ? (initialData.is_live ? 'live' : 'on-demand') : 'on-demand',
        image_thumbnail: course && course.image_thumbnail ? course.image_thumbnail : '',
        video_path: course && course.video_path ? course.video_path : '',
        is_cancellable: course && course.is_cancellable && course.is_cancellable > 0 ? true : false,
        days_before_cancellation: course && course.days_before_cancellation ? course.days_before_cancellation : 1,
        course_package_id: course && course.course_package ? course.course_package.id : '',
        category: initialData && initialData.course_category && initialData.course_category.name
    })

    const [imgPreview, setImgPreview] = useState(course && course.image_thumbnail ? course.image_thumbnail : null)

    const [videoPreview, setVideoPreview] = useState(course && course.video_path ? course.video_path : null)

    const [dialog, setDialog] = useState({
        open: false,
        title: translatables.texts.create_package,
        value: '',
        submitUrl: routes["course.package.create"]
    })

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

    const handleOnPackageCreate = () => {
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

    const handleOnDialogSubmit = e => {
        e.preventDefault()

        Inertia.post(dialog.submitUrl, { name: dialog.value },
            {
                onSuccess: () => {
                    setDialog(dialog => ({
                        ...dialog,
                        value: '',
                        open: false
                    }))
                }
            }
        )
    }

    const CoursePackageForm = () => (
        <Box pt={1}>
            <Input
                value={dialog.value}
                label={translatables.texts.name}
                onChange={e => setDialog(dialog => ({ ...dialog, value: e.target.value }))}
                inputProps={{ autoFocus: true }}
            />
        </Box>
    )

    return (
        <>
            <FormDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleSubmit={handleOnDialogSubmit}
                disableSubmit={dialog.value.length <= 0}
                children={<CoursePackageForm />}
            />
            <form onSubmit={handleOnFormSubmit}>
                <Container sx={{ mt: 4 }}>
                    <Grid container spacing={2}>
                        <Grid item container xs={12} alignItems="center" spacing={2}>
                            <Grid item xs={12} md={8}>
                                <Typography variant="h4" children={title} />
                                <Breadcrumbs>
                                    {
                                        courseApplication &&
                                        <Link href={routes["mypage.course.applications.index"]} children={translatables.title.class.applications.index} />
                                    }
                                    {
                                        course && [
                                            <Link key={'manage-classes'} href={routes["mypage.course.manage_class.index"]} children={translatables.title.class.manage.index} />,
                                            <Link
                                                key={'manage-class'}
                                                href={getRoute('mypage.course.manage_class.schedules', { id: course.id })}
                                                children={translatables.title.class.manage.view + ' - ' + translatables.title.schedules.index}
                                            />
                                        ]
                                    }
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
                                                onChange={value => handleEditorOnChange(value, setData, 'description')}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Autocomplete
                                                freeSolo
                                                options={categories.map(category => category.name)}
                                                fullWidth
                                                size="small"
                                                value={data.category}
                                                inputValue={data.category}
                                                onInputChange={(e, newValue) => setData('category', newValue)}
                                                renderInput={params =>
                                                    <Input
                                                        {...params}
                                                        label={translatables.texts.category}
                                                        value={data.category}
                                                        errors={errors}
                                                    />
                                                }
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
                                                label={translatables.texts.format}
                                                name="format"
                                                value={formatOptions[data.format]}
                                                inputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }}
                                                disabled
                                            />
                                        </Grid>
                                        {
                                            data && data.format === 'live' &&
                                            <Grid item xs={12}>
                                                <Input
                                                    label={translatables.texts.class_url}
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
                                                disabled
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Input
                                                label={translatables.texts.seats}
                                                value={data.max_participant}
                                                inputProps={{ readOnly: true }}
                                                disabled
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        name="is_cancellable"
                                                        checked={data.is_cancellable}
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
                                {
                                !nft && <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography children={translatables.texts.pricing_information} gutterBottom />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Input
                                                label={translatables.texts.price}
                                                value={data.price ? data.price : '0.00'}
                                                inputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }}
                                                disabled
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Input
                                                label={translatables.texts.points_earned}
                                                value={data.points_earned ? data.points_earned : '0.00'}
                                                inputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }}
                                                disabled
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent> 
                                }
                                {
                                nft && <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography children={translatables.texts.nft} gutterBottom />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Input
                                                label={translatables.title.nft}
                                                value={nft.name}
                                                inputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }}
                                                disabled
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Input
                                                label={translatables.texts.points}
                                                value={nft.points}
                                                inputProps={{ readOnly: true }}
                                                InputLabelProps={{ shrink: true }}
                                                disabled
                                            />
                                        </Grid>
                                    </Grid>
                                </CardContent> 
                                }
                            </Card>
                            <Card sx={{ mb: 2 }}>
                                <CardContent>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography children={translatables.texts.package_information} gutterBottom />
                                        </Grid>
                                        {
                                            packages && packages.length > 0 &&
                                            <Grid item xs={12}>
                                                <Input
                                                    select
                                                    name="course_package_id"
                                                    label={translatables.texts.package}
                                                    value={data.course_package_id}
                                                    InputLabelProps={{ shrink: true }}
                                                    onChange={e => handleOnChange(e, setData)}
                                                >
                                                    <option value="">None</option>
                                                    {displaySelectOptions(packages)}
                                                </Input>
                                            </Grid>
                                        }
                                        <Grid item xs={12}>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                children={translatables.texts.create_package}
                                                onClick={handleOnPackageCreate}
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
        </>
    )
}

export default Create
