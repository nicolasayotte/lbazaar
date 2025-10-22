import { Link } from "@inertiajs/inertia-react";
import { Grid, Card, CardContent, Button, Typography, CardMedia, Box, Chip, Stack} from "@mui/material"
import { getRoute } from "../../helpers/routes.helper"
import placeholderImg from "../../../img/placeholder.png"
import { CalendarMonth } from "@mui/icons-material";
import { usePage } from "@inertiajs/inertia-react"

const Course = ({ course, schedule = null, showDescription = true, viewDetailId = "id", imagePosition = "left" }) => {

    const { translatables } = usePage().props

    const Description = () => (
        showDescription &&
        <Typography
            variant="subtitle1"
            gutterBottom
            children={course.raw_description}
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

    const Price = () => (
        course.course_type && course.course_type.name == 'General' && course.price
        ? <Typography children={course.price} variant="h6" />
        : <span />
    )

    const Schedule = () => (
        schedule &&
        <Chip
            color="primary"
            icon={<CalendarMonth />}
            label={schedule}
            size="small"
            sx={{
                position: 'absolute',
                top: 5,
                right: 5,
                opacity: 1
            }}
        />
    )

    const Package = () => (
        course.course_package && course.course_package.id &&
        <Chip color="default" label={translatables.texts.package} size="small" variant="outlined" />
    )

    return (
        <Grid mt={2}>
            <Card
                sx={{
                    mb: 2,
                    display: 'flex',
                    position: 'relative',
                    flexDirection: {
                        xs: 'column',
                        md: (imagePosition == 'left' || imagePosition == 'right') ? 'row' : 'column'
                    }
                }}
            >
                <Schedule />
                <CardMedia
                    component="img"
                    image={course.image_thumbnail ?? placeholderImg}
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
                <CardContent sx={{ flexGrow: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} width="100%">
                                <Chip label={course.course_category.name} size="small" />
                                <Stack direction="row" spacing={1}>
                                    <Package />
                                    <Chip color={courseTypeColors[course.course_type.name]} label={course.course_type.name} size="small" variant="outlined" />
                                </Stack>
                            </Box>
                            <Typography variant="h6" children={course.title} />
                            <Typography variant="subtitle2" color="GrayText" gutterBottom children={`By ${course.professor.fullname}`} />
                            <Description />
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                                <Price />
                                <Link href={getRoute('course.details', {id : course[viewDetailId]})}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        children={translatables.texts.view_more}
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

export default Course
