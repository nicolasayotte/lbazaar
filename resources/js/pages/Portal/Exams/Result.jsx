import { Link, usePage } from "@inertiajs/inertia-react";
import { CheckCircle, CheckCircleOutline, Cancel, HighlightOff, } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { getRoute } from "../../../helpers/routes.helper";
import { pink } from '@mui/material/colors';

const Result = () => {

    const { result, translatables, passing_percentage } = usePage().props

    const isPassed = result.is_passed
    return (
        <Container>
            <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100vh' }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box textAlign="center" mb={2}>
                             <Typography textAlign="center" children={translatables.texts.score} />
                                <Typography
                                    variant="h3"
                                    children={`${result.total_score}/${result.exam.total_points}`}
                                    textAlign="center"
                                />
                              { isPassed ?
                                 <CheckCircleOutline color="success" sx={{ fontSize: '100px' }} /> : <HighlightOff color="red" sx={{ fontSize: '100px', color : '#ef5350' }} />
                              }
                                <Typography variant="subtitle2" textAlign="center" children={ isPassed ? translatables.texts.exam_passed : translatables.texts.exam_failed} />
                                <Typography variant="subtitle2" textAlign="center" children={`${translatables.texts.exam_passing_percentage} ${passing_percentage}%`} />

                            </Box>
                            <Box display="flex" justifyContent={ isPassed ? 'center' : 'space-between' } alignItems="center" mb={1} width="100%">
                                <Link href={getRoute('course.attend.index', { course_id: result.exam.course_id, schedule_id: result.course_schedule_id })}>
                                    <Button
                                        variant="contained"
                                        children={translatables.texts.back_to_class}
                                    />
                                </Link>
                                { !isPassed &&
                                    <Link href={getRoute('mypage.user_exam.retake', { user_exam_id: result.id })}>
                                        <Button
                                            variant="contained"
                                            children={translatables.texts.request_retake}
                                        />
                                    </Link>
                                }
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Result;
