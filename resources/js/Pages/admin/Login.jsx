import { Link, useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Divider, Grid, TextField, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import ErrorText from "../../components/common/ErrorText"
import { actions } from "../../store/slices/ToasterSlice"

const Login = () => {

    const dispatch = useDispatch()

    const { data, setData, post, processing, errors, clearErrors, reset } = useForm({
        email: '',
        password: ''
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post('/admin/authenticate', {
            onSuccess: response => {
                dispatch(actions.toggle({
                    open: true,
                    type: 'success',
                    message: 'User successfully authenticated'
                }))
            },
            onError: response => {
                dispatch(actions.toggle({
                    open: true,
                    type: 'error',
                    message: 'There was an error encountered'
                }))
            }
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
                                <Typography variant="h5" textAlign='center' sx={{ mb: 2 }}>ADMIN</Typography>
                                <Box>
                                    <TextField
                                        label="Email"
                                        type="email"
                                        fullWidth
                                        name="email"
                                        value={data.email}
                                        onChange={handleOnChange}
                                    />
                                    {errors && errors.email && <ErrorText error={errors.email}/>}
                                </Box>
                                <Box sx={{ my: 2 }}>
                                    <TextField
                                        label="Password"
                                        type="password"
                                        fullWidth
                                        name="password"
                                        value={data.password}
                                        onChange={handleOnChange}
                                    />
                                    {errors && errors.password && <ErrorText error={errors.password} />}
                                </Box>
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
                        <Link href="/">Back to Top Page</Link>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Login
