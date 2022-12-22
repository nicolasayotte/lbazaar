import { Link } from "@inertiajs/inertia-react";
import {Box, Grid, Card, ImageList, ImageListItem, CardActions, CardContent, Button, Typography} from "@mui/material"
import { useState } from "react"

const CourseContent = (props) => {

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
            <Typography variant="subtitle1"  sx={{
                float: 'right',
                position: 'absolute',
                top: '0px',
                right: '10px'}}>
                { props.course.schedule_datetime }
            </Typography>
        )
    }

    return (
        <Card sx={{ minWidth: 250, m: 2, position: 'relative' }}>
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={10} lg={10}>
                        { displayScheduledDateTime() }
                        <Typography variant="h6" gutterBottom>
                            {props.course.title}
                        </Typography>
                        { displayDescription() }
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default CourseContent
