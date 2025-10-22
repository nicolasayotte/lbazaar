import { Box, Card, CardContent, Container, Divider, Grid, Typography, Link } from "@mui/material"
import routes from "../../helpers/routes.helper"
import React from "react"
import BasePasswordForm from "../../components/common/forms/BasePasswordForm"

const UpdateTempPassword  = ({ errors, translatables }) => {

    const notification = (
        <Typography variant="h5">{translatables.texts.change_password}</Typography>
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
                                    <Typography variant="h8">{translatables.texts.temporary_password_notice}</Typography>
                            <BasePasswordForm
                                errors={errors.passwords}
                                messages={translatables}
                                routes={routes}
                                redirectUrl='top'
                            />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default UpdateTempPassword
