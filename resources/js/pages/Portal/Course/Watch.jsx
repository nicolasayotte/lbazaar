import { Link, usePage } from "@inertiajs/inertia-react"
import { VideoCameraBackOutlined } from "@mui/icons-material"
import { Box, Button, Container, Divider, Grid, Paper, Typography } from "@mui/material"
import { grey } from "@mui/material/colors"
import { getRoute } from "../../../helpers/routes.helper"

const Watch = () => {

    const { course, schedule, translatables } = usePage().props

    const Content = () => {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    backgroundColor: grey['600'],
                    py: 5
                }}
            >
                <Container>
                    {
                        course.is_live
                        ?
                            <>
                                <Paper sx={{ p: 4, minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Box textAlign="center">
                                        <VideoCameraBackOutlined color="disabled" sx={{ fontSize: '100px' }} />
                                        <a href={course.zoom_link} target="_blank" style={{ display: 'block' }}>
                                            <Button
                                                variant="contained"
                                                children={translatables.texts.redirect_to_zoom}
                                            />
                                        </a>
                                    </Box>
                                </Paper>
                            </>
                        :
                            <video
                                controls
                                src={course.video_path}
                                style={{ width: '100%' }}
                            />
                    }
                </Container>
            </Box>
        )
    }

    return (
        <>
            <Content />
            <Container>
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={9}>
                            <Typography variant="h5" children={translatables.texts.description} />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Link as="div" href={getRoute('course.attend.watch.done', { course_id: course.id, schedule_id: schedule.id })} method="post">
                                <Button
                                    variant="contained"
                                    fullWidth
                                    children={translatables.texts.done_watching}
                                />
                            </Link>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <div dangerouslySetInnerHTML={{ __html: course.description }} style={{ lineHeight: 1.8 }} />
                </Paper>
            </Container>
        </>
    )
}

export default Watch
