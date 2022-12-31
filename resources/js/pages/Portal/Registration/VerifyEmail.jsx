import { useForm } from "@inertiajs/inertia-react"
import { Alert, Box, Link, Card, CardContent, Container, Divider, Grid, TextField, Typography, FormControl, FormControlLabel, FormLabel, RadioGroup, Radio } from "@mui/material"

import React,{useState} from "react"

const VerifyEmail  = ({ isEmailVerified }) => {

    const notification = (
        <Typography variant="h5">Please verify your email</Typography>
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
                                    <Typography variant="h8">Before proceeding, please check your email for a verification link. </Typography>
                                    <Typography>If you did not receive the email, <Link method = "POST" href="/email/resend">Click here to request another</Link>.</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default VerifyEmail
