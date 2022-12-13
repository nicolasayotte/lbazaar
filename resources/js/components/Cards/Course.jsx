
import {Box, Grid, Card, ImageList, ImageListItem, CardActions, CardContent, Button, Typography} from "@mui/material"
import { Fragment, useState } from "react"

const Course = (props) => {

    const showDescription = props.showDescription !== undefined ? props.showDescription : true;

    return (
        <Card sx={{ minWidth: 280, m: 2, position: 'relative' }}>
          {(props.showDate !== undefined && props.showDate) && (
              <Typography variant="subtitle1" align="right">
                  {props.course.schedule_datetime}
              </Typography>
          )}
          <CardContent>
              <Grid container spacing={2}>
                  <Grid item xs={12} sm={12} md={10} lg={10}>
                      <Typography variant="h6" gutterBottom>
                        {props.course.title}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        {`By ${props.course.professor.first_name} ${props.course.professor.last_name}`}
                      </Typography>
                      { showDescription &&
                        (
                          <Typography variant="subtitle1" gutterBottom sx={{ p: 1}}>
                          {props.course.description}
                          </Typography>
                        )
                      }
                  </Grid>
              </Grid>
          </CardContent>
          <CardActions sx={{justifyContent: 'flex-end'}}>
            <Button sx={{
                float: 'right',
                position: 'absolute',
                bottom: '0px'
              }}
              size="small">View More</Button>
          </CardActions>
        </Card>
    );
}

export default Course
