import { Link } from "@inertiajs/inertia-react";
import { Grid, Card, CardActions, CardContent, Button, Typography, CardMedia, Divider, Box, Chip} from "@mui/material"
import { getRoute } from "../../helpers/routes.helper"

const Course = ({ course, showDescription = true, showDate = true, viewDetailId = "id", imagePosition = "left" }) => {

    const description = (
        showDescription &&
        <Typography
            variant="subtitle1"
            gutterBottom
            children={course.description}
            sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: 'hidden'
            }}
        />
    )

    const courseTypeColors = {
        'General': 'default',
        'Earn': 'primary',
        'Free': 'success',
        'Special': 'warning'
    }

    return (
        <Card
            sx={{
                mb: 2,
                display: 'flex',
                flexDirection: {
                    xs: 'column',
                    md: (imagePosition == 'left' || imagePosition == 'right') ? 'row' : 'column'
                }
            }}
        >
            <CardMedia
                component="img"
                image={course.image_thumbnail}
                sx={{
                    width: {
                        xs: '100%',
                        md: (imagePosition == 'left' || imagePosition == 'right') ? '250px' : '100%'
                    },
                    objectFit: 'cover',
                    objectPosition: 'center',
                    maxHeight: (imagePosition == 'left' || imagePosition == 'right') ? 'unset' : '150px'
                }}
            />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Chip label={course.course_category.name} size="small" />
                            <Chip color={courseTypeColors[course.course_type.name]} label={course.course_type.name} size="small" variant="outlined" />
                        </Box>
                        <Typography variant="h6" children={course.title} />
                        <Typography variant="subtitle2" color="GrayText" gutterBottom children={`By ${course.professor.fullname}`} />
                        { description }
                    </Grid>
                    <Grid item xs={12}>
                        <Box textAlign="right">
                            <Link href={getRoute('course.details', {id : course[viewDetailId]})}>
                                <Button
                                    size="small"
                                    variant="contained"
                                    children="View More"
                                />
                            </Link>
                        </Box>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default Course
