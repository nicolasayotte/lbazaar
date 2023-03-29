import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Box, Slider, Button, Card, CardContent, Container, Divider, Grid, Stack, Typography } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import { getRoute } from "../../helpers/routes.helper"
import Input from "../../components/forms/Input"
import ReactQuill from 'react-quill';
import { handleOnChange, handleEditorOnChange } from "../../helpers/form.helper";
import TextEditorInput from "../../components/forms/TextEditorInput"
import BackButton from "../../components/common/BackButton"

const CourseFeedback = () => {

    const dispatch = useDispatch()

    const { translatables, course, schedule, feedback, errors } = usePage().props;

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        rating: feedback.rating ?? 0,
        comments: feedback.comments ?? ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        post(getRoute('course.attend.feedback.store', { course_id: course.id, schedule_id: schedule.id }), {
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        });
    }

    const marks = [
        {
            value: 0,
            label: '0',
        },
        {
            value: 100,
            label: '100',
        }
    ];

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h4">{translatables.texts.class_feedback}</Typography>
                                <Typography variant="h5">{course.title}</Typography>
                                <Typography variant="subtitle1">{course.professor.fullname}</Typography>

                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={9} sm={9}>
                                        <Typography variant="h6">{translatables.texts.feedback_rating}</Typography>
                                        <Slider
                                            value={data.rating}
                                            name="rating"
                                            getAriaValueText={(value) => {value}}
                                            step={5}
                                            marks={marks}
                                            valueLabelDisplay="auto"
                                            onChange={e => handleOnChange(e, setData)} />

                                    </Grid>
                                    <Grid item xs={3} sm={3} sx={{mt:3}}>
                                        <Input
                                            value={data.rating}
                                            size="small"
                                            name="rating"
                                            onChange={e => handleOnChange(e, setData)}
                                            errors={errors}
                                            inputProps={{
                                                step: 5,
                                                min: 0,
                                                max: 100,
                                                type: 'number',
                                                    'aria-labelledby': 'input-slider',
                                            }}

                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={12}>
                                        <Typography variant="h6">{translatables.texts.comments}</Typography>
                                        <TextEditorInput
                                            name="comments"
                                            value={data.comments}
                                            onChange={(value) => handleEditorOnChange(value, setData, 'comments')}
                                            style={{height: '200px'}}
                                            errors={errors}
                                            />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={1} justifyContent="end">
                                            <BackButton processing={processing}/>
                                            <Button
                                                onClick={handleSubmit}
                                                variant="contained"
                                                disabled={processing}
                                            >{translatables.texts.submit}</Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default CourseFeedback
