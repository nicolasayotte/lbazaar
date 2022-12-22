import {Grid, Divider, Card, CardActions, CardContent, Button, Typography} from "@mui/material"
import { useState } from "react"

const Feedback = (props) => {

    return (
        <Card sx={{ minWidth: 275, m: 2, position: 'relative' }}>
            <CardContent>
                <Grid container justifyContent="space-between">  
                    <Typography inline="true" align="left" variant="subtitle1">
                        {`${props.feedback.user.fullname}`}  <Typography inline="true" align="left" variant="caption">{ props.feedback.created_at}</Typography>
                    </Typography>
                    <Typography inline="true" align="right" variant="subtitle1">
                        {`rating : ${props.feedback.rating} / 100`}
                    </Typography>
                </Grid>
                <Divider />
                <Typography variant="caption" gutterBottom>
                    {props.feedback.comments}
                </Typography>
            </CardContent>
        </Card>
    );
}

export default Feedback
