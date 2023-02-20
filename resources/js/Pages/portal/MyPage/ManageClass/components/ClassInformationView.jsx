import { Edit } from "@mui/icons-material"
import { Chip, Button, Grid, Box, Card, CardContent, Typography, Divider } from "@mui/material"

const ClassInformationView = ({ course, viewEditCourse }) => {

    const generalInformationStyle = {
        textAlign: {
            xs: "right",
            md: "left"
        }
    }

    const generalInformationButtonStyle = {
        textAlign: {
            xs: "left",
            md: "right"
        }
    }

    const courseTypeColors = {
        'General': 'default',
        'Earn': 'primary',
        'Free': 'success',
        'Special': 'warning'
    }

    const displayInformation = (
        <Box>
            <Grid container sx={{mb:4}} spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="h5" children="General Information"></Typography>
                    </Grid>
                    {/* <Grid item xs={12} sm={6} sx={generalInformationButtonStyle}>
                        <Button
                            children="Edit Information"
                            variant="contained"
                            startIcon={<Edit />}
                            size="small"
                            onClick={viewEditCourse}
                        />
                    </Grid> */}

                </Grid>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle" children="Title"></Typography>
                </Grid>
                <Grid item xs={12} sm={10}>
                    <Typography children={course.title}></Typography>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Typography variant="subtitle" children="Type"></Typography>
                </Grid>
                <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                    <Chip
                        color={courseTypeColors[course.type]}
                        variant="outlined"
                        size="small"
                        label={course.type}
                        sx={{ ml: 1 }}
                    />
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Typography variant="subtitle" children="Category"></Typography>
                </Grid>
                <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                    <Typography children={course.category}></Typography>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Typography variant="subtitle" children="Type"></Typography>
                </Grid>
                <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                    <Typography children={course.type}></Typography>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Typography variant="subtitle" children="Language"></Typography>
                </Grid>
                <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                    <Typography children={course.language}></Typography>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Typography variant="subtitle" children="Price"></Typography>
                </Grid>
                <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                    <Typography children={course.price}></Typography>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={6} sm={2}>
                    <Typography variant="subtitle" children="Points Earned"></Typography>
                </Grid>
                <Grid item xs={6} sm={10} sx={generalInformationStyle}>
                    <Typography children={course.pointsEarned}></Typography>
                </Grid>
                <Grid item xs={12} sm={12}>
                    <Divider />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Typography variant="subtitle" children="Description"></Typography>
                </Grid>
                <Grid item xs={12} sm={10}>
                    <div style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: course.description }} />
                </Grid>
            </Grid>
        </Box>
    )

    return (
        <Card>
            <CardContent sx={{ p: 4 }}>
                    {displayInformation}
            </CardContent>
        </Card>
    )
}

export default ClassInformationView
