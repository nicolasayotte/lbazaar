import { Box, Card, CardContent, Container, Divider, Grid, Typography, Link } from "@mui/material"
import routes from "../../../helpers/routes.helper"
import React from "react"

const VerifyEmail  = () => {

    const notification = (
        <Typography variant="h5">Please verify your email</Typography>
    )

    return (
        <Box>
            <Container>
                <Grid
                    container
                    alignItems="center"
                    justifyContent="center"
                    sx={{ minHeight: '100vh' }}
                >
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                { notification }
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h8">Before proceeding, please check your email for a verification link. If you did not receive the email,</Typography>
                                <Link method = "POST" href={routes["resend.emailverification.send"]}> Click here to request another.</Link>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default VerifyEmail
