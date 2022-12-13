import { Box, Button, Card, CardContent, Container, Divider, Grid, TextField, Typography } from "@mui/material"

const Inquiries = () => {

    return (
        <Box my={5}>
            <Container>
                <Grid container>
                    <Grid item xs={12} sm={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <form>
                                    <Typography variant="h5">Inquiry</Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Name"
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} >
                                            <TextField
                                                label="Email Address"
                                                type="email"
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Subject"
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Message"
                                                multiline
                                                fullWidth
                                                minRows={9}
                                            />
                                        </Grid>
                                        <Grid item xs={12} textAlign="right">
                                            <Button variant="contained">Submit</Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default Inquiries
