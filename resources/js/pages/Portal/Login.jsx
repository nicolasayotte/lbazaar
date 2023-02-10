import { useForm, Link } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import routes from "../../helpers/routes.helper"

const Login = () => {

    const dispatch = useDispatch()

    const { data, processing, setData, post, errors } = useForm({
        email: '',
        password: ''
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post(routes["portal.authenticate"], {
            onSuccess: () => dispatch(actions.success({
                message: 'User successfully authenticated'
            })),
            onError: () => dispatch(actions.error({
                message: 'There was an error encountered'
            }))
        });
    }

    return (
        <Container>
            <Grid
                container
                alignItems='center'
                justifyContent='center'
                minHeight="100vh"
            >
                <Grid item xs={12} sm={8} md={5}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <form method="POST" onSubmit={handleSubmit}>
                                <Typography variant="h5" textAlign='center' sx={{ mb: 2 }}>SIGN IN</Typography>
                                <Box>
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
                                <Box sx={{ my: 2 }}>
                                    <Input
                                        label="Password"
                                        type="password"
                                        fullWidth
                                        name="password"
                                        value={data.password}
                                        onChange={handleOnChange}
                                        errors={errors}
                                    />
                                </Box>
                                <Typography color="primary" mb={2} variant="caption" display="block">
                                    <Link href={routes["forgot.password.index"]}>Forgot Password?</Link>
                                </Typography>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >SIGN IN</Button>
                            </form>
                        </CardContent>
                    </Card>
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Link href={routes["register.index"]}><Button>Create account</Button></Link>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}
export default Login

