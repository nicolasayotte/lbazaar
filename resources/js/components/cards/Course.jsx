import { Link } from "@inertiajs/inertia-react";
import {Box, Grid, Card, ImageList, ImageListItem, CardActions, CardContent, Button, Typography} from "@mui/material"
import { Fragment, useState } from "react"

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
            <Typography variant="subtitle1" align="right">
                { props.course.schedule_datetime }
            </Typography>
        )
    }

    return (
        <Card sx={{ minWidth: 250, m: 2, position: 'relative' }}>
            { displayScheduledDateTime() }
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={10} lg={10}>
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
            <CardActions sx={{justifyContent: 'flex-end'}}>

            <Link href={`/courses/details/${props.course[props.viewDetailId]}`}
                sx={{
                    float: 'right',
                    position: 'absolute',
                    bottom: '0px'}}
                size="small">View More</Link>
            </CardActions>
        </Card>
    );
}

export default Course
