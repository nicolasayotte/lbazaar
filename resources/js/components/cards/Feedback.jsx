
import {Box, Grid, Divider, Card, CardActions, CardContent, Button, Typography} from "@mui/material"
import { useState } from "react"

const Feedback = (props) => {
    return (
        <Card sx={{ minWidth: 275, m: 2, position: 'relative' }}>
            <CardContent>
                <Grid container justifyContent="space-between">  
                    <Typography inline="true" align="left" variant="subtitle1">
                        {`${props.feedback.user.fullname}`}
                    </Typography>
                    <Typography inline="true" align="right" variant="subtitle1">
                        {`${props.feedback.rating} / 100`}
                    </Typography>
                </Grid>
                <Divider />
                <Typography variant="caption" gutterBottom>
                    {props.feedback.comments}
                </Typography>
            </CardContent>
            <CardActions sx={{justifyContent: 'flex-end', mt: 2}}>
                <Button sx={{
                      float: 'right',
                      position: 'absolute',
                      bottom: '0px'
                    }}
                    size="small">View Profile</Button>
            </CardActions>
        </Card>
    );
}

export default Feedback
