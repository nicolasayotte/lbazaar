
import {Grid, Card, CardActions, CardContent, Button, Typography} from "@mui/material"
import { useState } from "react"

const Course = (props) => {
    return (
        <Card sx={{ minWidth: 275, m: 2, position: 'relative' }}>
            <CardContent>
                <Grid container justifyContent="space-between">  
                    <Typography inline="true" align="left" variant="h6">
                        {`${props.user.fullname}`}
                    </Typography>
                    <Typography inline="true" align="right" variant="subtitle1">
                        {props.user.country}
                    </Typography>
                </Grid>
            </CardContent>
            <CardActions sx={{justifyContent: 'flex-end'}}>
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

export default Course
