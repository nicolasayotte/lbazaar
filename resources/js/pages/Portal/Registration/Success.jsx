import { Link, usePage } from "@inertiajs/inertia-react"
import { CheckCircle } from "@mui/icons-material"
import { Box, Button, Container, Grid, Paper, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const Success = () => {

    const { translatables } = usePage().props

    return (
        <>
            <Container>
                <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100vh' }}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Box textAlign="center">
                                <CheckCircle sx={{ fontSize: '100px'}} color="success" />
                            </Box>
                            <Typography variant="h6" children={translatables.texts.application_submitted} gutterBottom textAlign="center" />
                            <Typography variant="body2" color="GrayText" children={translatables.texts.application_submitted_description} />
                            <Box mt={2} textAlign="center">
                                <Link href={'/'}>
                                    <Button
                                        variant="contained"
                                        children={translatables.texts.back_to_top}
                                    />
                                </Link>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    )
}

export default Success
