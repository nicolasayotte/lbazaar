import { Link } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Divider, Grid, TextField, Typography } from "@mui/material"

const Login = () => {
    return (
        <Container>
            <Grid
                container
                alignItems='center'
                justifyContent='center'
                sx={{
                    minHeight: '100vh'
                }}
            >
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h5" textAlign='center' sx={{ mb: 2 }}>ADMIN</Typography>
                            <TextField
                                label="Email"
                                type="email"
                                fullWidth
                            />
                            <TextField
                                label="Password"
                                type="password"
                                fullWidth
                                sx={{ my: 2 }}
                            />
                            <Button fullWidth variant="contained">SIGN IN</Button>
                        </CardContent>
                    </Card>
                    <Box
                        sx={{
                            textAlign: 'center',
                            mt: 3
                        }}
                    >
                        <Link href="/">Back to Top Page</Link>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Login
