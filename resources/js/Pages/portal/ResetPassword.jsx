import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import { actions } from "../../store/slices/ToasterSlice"
import { getRoute } from "../../helpers/routes.helper"

const ResetPassword = ({ errors, messages, token }) => {

    const dispatch = useDispatch()

    const email = new URLSearchParams(window.location.search).get('email');

    const { data, setData, patch, processing } = useForm({
        email: email,
        password: '',
        token: token,
        password_confirmation: ''
    })

    const handleOnChange = e => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = e => {
        e.preventDefault()

        patch(getRoute('password.reset.update', {token}), {
            onSuccess: () => {
                dispatch(actions.success({
                    message: messages.success.password
                }))
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    return (
        <Card key="Password Form Card" sx={{ mt: 2 }}>
            <form onSubmit={handleSubmit}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography fontFamily="inherit" variant="h5" component="div">Update Password</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Input
                                label="Email"
                                name="email"
                                disabled
                                errors={errors}
                                value={data.email}
                                onChange={handleOnChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label="New Password"
                                name="password"
                                data={data.new_password}
                                errors={errors}
                                onChange={handleOnChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label="Confirm Password"
                                name="password_confirmation"
                                data={data.new_password_confirmation}
                                errors={errors}
                                onChange={handleOnChange}
                            />
                        </Grid>
                        <Grid item xs={12} textAlign="right">
                            <Button
                                type="submit"
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={processing}
                            >Update Password</Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </form>
        </Card>
    )
}

export default ResetPassword
