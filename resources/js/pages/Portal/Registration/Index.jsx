import { Link, usePage } from "@inertiajs/inertia-react"
import { AccountCircle, SupervisedUserCircle } from "@mui/icons-material"
import { Button, Container, Grid, Paper, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const Index = () => {

    const { translatables } = usePage().props

    return (
        <Container>
            <Grid container justifyContent="center" alignItems="center" minHeight="100vh" spacing={2}>
                <Grid item xs={12} md={6}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h5" textAlign="center" children={translatables.texts.sign_up} />
                            <Typography
                                variant="caption"
                                textAlign="center"
                                children={translatables.texts.choose_role}
                                color="GrayText"
                                sx={{ width: '100%', display: 'block' }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <SupervisedUserCircle sx={{ fontSize: 100, my: 4 }} color="action" />
                                <Link href={routes["register.student"]}>
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="large"
                                        children={translatables.texts.sign_up_student}
                                    />
                                </Link>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, textAlign: 'center' }}>
                                <AccountCircle sx={{ fontSize: 100, my: 4 }} color="action" />
                                <Link href={routes["register.teacher"]}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        children={translatables.texts.sign_up_teacher}
                                    />
                                </Link>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} mt={3} sx={{ textAlign: 'center' }}>
                            <Link href={routes["portal.login"]}>
                                <Button children={translatables.texts.back_to_sign_in} />
                            </Link>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Index
