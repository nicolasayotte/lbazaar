import { Box, Card, CardContent, Container, Divider, Grid, Typography, Link } from "@mui/material"
import routes from "../../helpers/routes.helper"
import React from "react"

const UpdateTempPassword  = () => {

    const notification = (
        <Typography variant="h5">Password Temporary</Typography>
    )

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                { notification }
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h8">Your password is still the temporary. For security purposes, please update your password by going to this </Typography>
                                    <Link method = "GET" href={routes["mypage.profile.index"]}> Link</Link>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default UpdateTempPassword
