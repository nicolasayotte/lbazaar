import { useForm, usePage } from "@inertiajs/inertia-react"
import { Cancel, Edit, Save } from "@mui/icons-material"
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Grid, Box, Card, CardContent, Typography, Divider } from "@mui/material"
import { useDispatch } from "react-redux"
import { displaySelectOptions, handleOnChange, handleEditorOnChange, handleOnFileChange } from "../../../../../helpers/form.helper"
import Input from "../../../../../components/forms/Input"
import { useEffect, useState } from "react"
import TextEditorInput from "../../../../../components/forms/TextEditorInput"
import { actions } from "../../../../../store/slices/ToasterSlice"
import FileInput from "../../../../../components/forms/FileInput"

const ClassInformationForm = ({ course, cancelEdit, typeOptions, routes, categoryOptions, errors }) => {

    const dispatch = useDispatch()

    const { messages } = usePage().props

    const [isEarned, setIsEarned] = useState(false);

    const [isPaidClass, setIsPaidClass] = useState(false);

    const [disabledForm, setDisabledForm] = useState(false);

    const languageOption = [
        { name: 'English', value: 'English' },
        { name: 'Japanese', value: 'Japanese' }
    ]

    const { data, setData, post, processing } = useForm('CourseForm', {
        id: course.id,
        title: course.title,
        description: course.description,
        course_category_id: course.categoryId,
        language: course.language,
        imageThumbnail: [],
    })

    const generalInformationStyle = {
        textAlign: {
            xs: "right",
            md: "left"
        }
    }

    const generalInformationButtonStyle = {
        textAlign: {
            xs: "left",
            md: "right"
        }
    }

    const handleSubmit = e => {
        e.preventDefault()

        post(routes["mypage.course.manage_class.course.update"], {
            preserveScroll: true,
            errorBag: 'course',
            forceFormData: true,
            onSuccess: (response) => {
                setDisabledForm(true)
                dispatch(actions.success({
                    message: messages.success.class_generated
                }))
                setDisabledForm(false)
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }


    const handleFilesChange = (files) => {
        setData(data => ({
            ...data,
           imageThumbnail: [files],
        }))
    };


    useEffect(() => {
        if (course.typeId == 3) {
            setIsEarned(true)
            setIsPaidClass(true)
        }

        if (course.typeId == 1 || course.typeId == 4) {
            setIsPaidClass(true)
            setIsEarned(false)
        }
    }, [])

    const displayPrice = () => (isPaidClass &&
        <>
            <Grid item xs={12} sm={12}>
                <Divider />
            </Grid>
            <Grid item xs={6} sm={2}>
                <Typography variant="subtitle" children="Price"></Typography>
            </Grid>
            <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                <Typography children={course.price}></Typography>
            </Grid>
        </>
    )

    const displayPointsEarned = () => (setIsEarned &&
        <>
            <Grid item xs={12} sm={12}>
                <Divider />
            </Grid>
            <Grid item xs={6} sm={2}>
                <Typography variant="subtitle" children="Points Earned"></Typography>
            </Grid>
            <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                <Typography children={course.pointsEarned}></Typography>
            </Grid>
        </>
    )

    const displayForm = (
        <Box>
            <Grid container spacing={2}>
                    <Grid container sx={{mb:4}} spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="h5" children="General Information"></Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} sx={generalInformationButtonStyle}>
                            <Button
                                sx={{mr: 2}}
                                children="Update"
                                variant="contained"
                                startIcon={<Save />}
                                size="small"
                                onClick={handleSubmit}
                            />
                            <Button
                                children="Cancel"
                                variant="outlined"
                                startIcon={<Cancel />}
                                color="primary"
                                size="small"
                                onClick={cancelEdit}
                            />
                        </Grid>
                    </Grid>

                    <Grid item xs={12} sm={2}>
                        <Typography variant="subtitle" children="Title"></Typography>
                    </Grid>
                    <Grid item xs={12} sm={10}>
                        <Input
                            name="title"
                            value={data.title}
                            onChange={e => handleOnChange(e, setData)}
                            errors={errors}
                            disabled={disabledForm}

                        />
                    </Grid>
                    <Grid item xs={12} sm={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Typography variant="subtitle" children="Thumbnail"></Typography>
                    </Grid>
                    <Grid item xs={12} sm={10}>
                        <FileInput
                            name="imageThumbnail"
                            onChange={handleFilesChange}
                            value={data.imageThumbnail}
                            errors={errors}
                        />
                    </Grid>
                    <Grid item xs={12} sm={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <Typography variant="subtitle" children="Type"></Typography>
                    </Grid>
                    <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                        <Typography children={course.type}></Typography>
                    </Grid>
                    <Grid item xs={12} sm={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <Typography variant="subtitle" children="Category"></Typography>
                    </Grid>
                    <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                        <Input
                            select
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
                    {displayPrice()}
                    {displayPointsEarned()}
                    <Grid item xs={12} sm={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <Typography variant="subtitle" children="Language"></Typography>
                    </Grid>
                    <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                        <Input
                            select
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
                    <Grid item xs={12} sm={12}>
                        <Divider />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                        <Typography variant="subtitle" children="Description"></Typography>
                    </Grid>
                    <Grid item xs={12} sm={10}>
                        <TextEditorInput
                            name="Description"
                            value={data.description}
                            onChange={(value) => handleEditorOnChange(value, setData, 'description')}
                            style={{height: '200px'}}
                            errors={errors}
                        />

                    </Grid>
            </Grid>
        </Box>
    )

    return (
        <Card>
            <CardContent sx={{ p: 4 }}>
                {displayForm}
            </CardContent>
        </Card>
    )
}

export default ClassInformationForm
