import { Box, Button, Card, CardContent, Grid, TextField, Typography } from "@mui/material"

const Profile = () => {
    return (
        <Box>
            <Typography fontFamily="inherit" variant="h4" sx={{ mb: 2 }}>Profile</Typography>
            <Card>
                <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="First Name"
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                label="Last Name"
                                fullWidth
                            />
                        </Grid>
                        <Grid item md={12}>
                            <TextField
                                label="Email"
                                fullWidth
                                disabled
                            />
                        </Grid>
                        <Grid item md={12}>
                            <TextField
                                label="Country"
                                fullWidth
                                select
                                SelectProps={{
                                    native: true
                                }}
                            >
                                <option key="PH" value="Philippines">Philipines</option>
                                <option key="JP" value="Japan">Japan</option>
                            </TextField>
                        </Grid>
                        <Grid item md={12} textAlign="right">
                            <Button variant="contained">Update</Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    )
}

export default Profile
