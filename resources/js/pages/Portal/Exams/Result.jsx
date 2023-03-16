import { Link, usePage } from "@inertiajs/inertia-react";
import { CheckCircle, CheckCircleOutline } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import { getRoute } from "../../../helpers/routes.helper";

const Result = () => {

    const { result, translatables } = usePage().props

    return (
        <Container>
            <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100vh' }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box textAlign="center" mb={2}>
                                <CheckCircleOutline color="success" sx={{ fontSize: '100px' }} />
                                <Typography variant="h6" textAlign="center" children={translatables.success.exams.submit} />
                            </Box>
                            <Link href={getRoute('course.attend.index', { course_id: result.exam.course_id, schedule_id: result.course_schedule_id })}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    children={translatables.texts.back_to_class}
                                />
                            </Link>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Result;
