import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import { actions } from "../../../../store/slices/ToasterSlice"

const PasswordForm = ({ errors, messages, routes }) => {

    const dispatch = useDispatch()

    const { data, setData, patch, processing, post } = useForm('PasswordForm', {
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    })

    const handleOnChange = e => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = e => {
        e.preventDefault()

        patch(routes['admin.password.update'], {
            errorBag: 'passwords',
            onSuccess: () => {
                dispatch(actions.success({
                    message: messages.success.password
                }))

                setTimeout(() => {
                    post(routes['admin.logout'], {
                        onSuccess: () => dispatch(actions.success({
                            message: messages.success.user.logout
                        }))
                    })
                }, 2000)
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
                        <Typography variant="p" fontSize="small" color={"GrayText"}>You will be signed out when your password is updated</Typography>
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label="Current Password"
                                name="current_password"
                                helperText="Enter your current password for verification"
                                data={data.current_password}
                                errors={errors}
                                onChange={handleOnChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label="New Password"
                                name="new_password"
                                data={data.new_password}
                                errors={errors}
                                onChange={handleOnChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label="Confirm Password"
                                name="new_password_confirmation"
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

export default PasswordForm
