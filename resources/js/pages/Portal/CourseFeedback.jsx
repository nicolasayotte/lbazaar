import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Box, Slider, Button, Card, CardContent, Container, Divider, Grid, Stack, Typography } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import { getRoute } from "../../helpers/routes.helper"
import Input from "../../components/forms/Input"
import { handleOnChange, handleEditorOnChange } from "../../helpers/form.helper";
import TextEditorInput from "../../components/forms/TextEditorInput"
import { Inertia } from "@inertiajs/inertia"

const CourseFeedback = () => {

    const dispatch = useDispatch()

    const { translatables, course, schedule, feedback, errors, return_url } = usePage().props;

    const { data, setData, processing, reset, clearErrors } = useForm({
        rating: feedback ? feedback.rating ??  0 : 0,
        comments: feedback ? feedback.comments ?? '' : ''
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        if (feedback) {
            Inertia.patch(
                getRoute('course.feedbacks.update', { id: feedback.id }),
                data,
                {
                    onError: () => dispatch(actions.error({ message: translatables.error }))
                }
            )

            return
        }

        Inertia.post(
            getRoute('course.attend.feedback.store', { course_id: course.id, schedule_id: schedule.id }),
            data,
            {
                onError: () => dispatch(actions.error({ message: translatables.error }))
            }
        )
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
        <Box>
            <Container>
                <Grid container sx={{ minHeight: '100vh' }} alignItems="center">
                    <Grid item xs={12} md={8} mx="auto">
                        <Card sx={{ mt: -10 }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h4" children={translatables.texts.give_feedback} gutterBottom />
                                <Typography children={`${translatables.texts.title}: ${course.title}`} />
                                <Typography variant="caption" color="GrayText" children={course.professor.fullname} />

                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={10}>
                                        <Typography variant="body1" children={translatables.texts.rating} />
                                        <Slider
                                            value={data.rating}
                                            name="rating"
                                            getAriaValueText={(value) => {value}}
                                            step={5}
                                            marks={marks}
                                            valueLabelDisplay="auto"
                                            onChange={e => handleOnChange(e, setData)} />

                                    </Grid>
                                    <Grid item xs={12} md={2}>
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
                                                style: {
                                                    textAlign: 'center'
                                                }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={12}>
                                        <Typography variant="body1" children={translatables.texts.content} />
                                        <TextEditorInput
                                            name="content"
                                            value={data.comments}
                                            onChange={(value) => handleEditorOnChange(value, setData, 'comments')}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={1} justifyContent="end">
                                                <Link href={return_url}>
                                                    <Button children={translatables.texts.back} />
                                                </Link>
                                                <Button
                                                    onClick={handleSubmit}
                                                    variant="contained"
                                                    disabled={processing}
                                                    children={translatables.texts.submit}
                                                />
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
