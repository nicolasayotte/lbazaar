
import {Box, Card, CardActions, CardContent, Button, Typography} from "@mui/material"
import { useState } from "react"

const Course = (props) => {
    return (
        <Card sx={{ minWidth: 275, m: 2, position: 'relative' }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    { `${props.user.first_name} ${props.user.last_name}` }
                </Typography>
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
