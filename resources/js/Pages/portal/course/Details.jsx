import { Box, Divider, TextField, Button, Pagination, CircularProgress, FormControl, InputLabel, Select, MenuItem, Grid, Typography, Container, Card } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";

const Details = (props) => {

    const displayFeedbacks = () => {
        return (
            props.course.feedbacks.map(feedback => {
                return <Feedback key={feedback.id} feedback={feedback}/>
            })
        )
    }

    return (
        <Box>
            <Card sx={{mt: 2}}>
                <Grid container sx={{m: 4}}>
                    <Grid item xs={10} sm={11} md={11} lg={11}>
                        <Divider sx={{ my: 2 }}>Feedbacks</Divider>
                        {displayFeedbacks()}
                    </Grid>
                </Grid>
            </Card>
        </Box>
    )
}

export default Details;
