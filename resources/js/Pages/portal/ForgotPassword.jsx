import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import { actions } from "../../store/slices/ToasterSlice"
import routes from "../../helpers/routes.helper"

const ForgotPassword = () => {

    const dispatch = useDispatch()

    const { errors, translatables } = usePage().props

    const { data, setData, post, processing } = useForm({
        email: ''
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post('/forgot-password', {
            onSuccess: response => {
                dispatch(actions.success({
                    message: translatables.success.forgotPassword
                }))
            },
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

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
                <Grid item xs={12} sm={8} md={5}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <form method="POST" onSubmit={handleSubmit}>
                                <Typography variant="h5" textAlign='center' sx={{ mb: 2 }}>Forgot Password</Typography>
                                <Box sx={{ my: 2 }}>
                                    <Input
                                        label="Email"
                                        type="email"
                                        fullWidth
                                        name="email"
                                        value={data.email}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    />
                                </Box>
                                <Button
                                    sx={{ my: 2 }}
                                    variant="contained"
                                    fullWidth
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >Submit</Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Link href={routes["portal.login"]}><Button>Back to sign in</Button></Link>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}

export default ForgotPassword
