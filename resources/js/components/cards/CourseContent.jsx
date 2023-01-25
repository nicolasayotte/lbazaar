import { Card, CardContent, Typography, CardMedia, Divider, Box} from "@mui/material"

const CourseContent = ({ course, showDescription = true, showDate = true }) => {

    const description = (
        showDescription && <Typography variant="subtitle1" gutterBottom children={course.description} />
    )

    const schedule = (
        showDate && <Typography variant="caption" color="GrayText" children={`Schedule: ${course.schedule_datetime}`} />
    )

    return (
        <Card
            sx={{
                display: 'flex',
                minHeight: 200,
                flexDirection: {
                    xs: 'column',
                    md: 'row'
                }
            }}
        >
            <CardMedia
                component="img"
                image={course.image_thumbnail}
                sx={{
                    width: {
                        xs: '100%',
                        md: '250px'
                    },
                    objectFit: 'cover',
                    objectPosition: 'center'
                }}
            />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Typography variant="h6" gutterBottom children={course.title} />
                { description }
                <Box>
                    { showDate && <Divider sx={{ my: 2 }} />}
                    { schedule }
                </Box>
            </CardContent>
        </Card>
    );
}

export default CourseContent
