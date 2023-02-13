import { Link } from "@inertiajs/inertia-react";
import { Grid, Card, CardContent, Button, Typography, CardMedia, Box, Chip} from "@mui/material"
import { getRoute } from "../../helpers/routes.helper"

const UpcomingCourse = ({ upcomingCourse, showDescription = true, showDate = true, viewDetailId = "id", imagePosition = "left" }) => {

    const description = (
        showDescription &&
        <Typography
            variant="subtitle1"
            gutterBottom
            children={upcomingCourse.course.description}
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

    const price = (
        upcomingCourse.course_type && upcomingCourse.course_type.name == 'General' && upcomingCourse.course.price
        ? <Typography children={upcomingCourse.course.price} variant="h6" />
        : <span />
    )

    const scheduleDate = (
        showDate &&
        <Typography
            variant="subtitle1"
            children={upcomingCourse.schedule_datetime}
            sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: 'hidden'
            }}
        />
    )

    return (
        <Grid mt={2}>
                { scheduleDate }
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
                    image={upcomingCourse.course.image_thumbnail}
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
                                <Chip label={upcomingCourse.course_category.name} size="small" />
                                <Chip color={courseTypeColors[upcomingCourse.course_type.name]} label={upcomingCourse.course_type.name} size="small" variant="outlined" />
                            </Box>
                            <Typography variant="h6" children={upcomingCourse.course.title} />
                            <Typography variant="subtitle2" color="GrayText" gutterBottom children={`By ${upcomingCourse.professor.fullname}`} />
                            { description }
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                { price }
                                <Link href={getRoute('course.details', {id : upcomingCourse[viewDetailId]})}>
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
        </Grid>
    );
}

export default UpcomingCourse
