import { Box, TextField, Button, Pagination, CircularProgress, FormControl, InputLabel, Select, MenuItem, Grid, Typography, Container, Card } from "@mui/material";

const Details = (props) => {

    return (
        <Box>
            <Card sx={{mt: 2}}>
                <Grid container sx={{m: 4}}>
                    {props.course.title}
                </Grid>
            </Card>
        </Box>
    )
}

export default Details;
