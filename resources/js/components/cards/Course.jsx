import { Link } from "@inertiajs/inertia-react";
import {Box, Grid, Card, ImageList, ImageListItem, CardActions, CardContent, Button, Typography} from "@mui/material"
import { Fragment, useState } from "react"
import { getRoute } from "../../helpers/routes.helper"
const Course = (props) => {

    const showDescription = props.showDescription !== undefined ? props.showDescription : true;

    const displayDescription = () => {
        return showDescription &&
            (
                <Typography variant="subtitle1" gutterBottom sx={{ p: 1}}>
                    { props.course.description }
                </Typography>
            )
    }

    const displayScheduledDateTime = () => {
        return (props.showDate !== undefined && props.showDate) && (
            <Typography variant="subtitle1" align="right" sx={{mr: 2}}>
                { props.course.schedule_datetime }
            </Typography>
        )
    }

    return (
        <Card className="course-card" sx={{ minWidth: 250, m: 1, position: 'relative' }}>
            { displayScheduledDateTime() }
            <CardContent sx={{mb:4}}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={10} lg={10}>
                        <Typography variant="subtitle1" gutterBottom>
                            {props.course.course_type.name}
                        </Typography>
                        <Typography variant="h6" gutterBottom>
                            {props.course.title}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                            {`By ${props.course.professor.first_name} ${props.course.professor.last_name}`}
                        </Typography>
                        { displayDescription() }
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions sx={{justifyContent: 'flex-end',  right: '0px',
                        position: 'absolute',
                        bottom: '0px'}}>
                <Link href={getRoute('course.details', {id : props.course[props.viewDetailId]})}>
                    <Button>View More</Button>
                </Link>
            </CardActions>
        </Card>
    );
}

export default Course
