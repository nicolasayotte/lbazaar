import { useForm, Link } from "@inertiajs/inertia-react"
import { Alert, Box, Button, Card, CardContent, Container, Grid, TextField, Typography, FormControl, FormControlLabel, FormLabel, RadioGroup, Radio } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import routes from "../../helpers/routes.helper"
import { displaySelectOptions } from "../../helpers/form.helper"
import React,{useState} from "react"

const Login = ({errors}) => {

    const dispatch = useDispatch()

    const { data, processing, setData, post } = useForm({
        email: '',
        password: ''
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post(routes["portal.authenticate"], {
            onSuccess: response => {
                dispatch(actions.success({
                    open: true,
                    type: 'success',
                    message: 'User successfully authenticated'
                }))
            },
            onError: () => dispatch(actions.error({
                open: true,
                type: 'error',
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
                sx={{
                    minHeight: '100vh'
                }}
            >
                <Grid item xs={12} sm={8} md={5}>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <form method="POST" onSubmit={handleSubmit}>
                                <Typography variant="h5" textAlign='center' sx={{ mb: 2 }}>LOGIN</Typography>
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
                                <Box sx={{ textAlign: 'center', mt: 3, mb: 3 }}>
                                    <Link href={routes["register.index"]}>Create account</Link>
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

                </Grid>
            </Grid>
        </Container>
    )
}
export default Login

