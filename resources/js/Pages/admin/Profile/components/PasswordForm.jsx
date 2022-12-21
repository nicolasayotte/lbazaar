import { useForm } from "@inertiajs/inertia-react"
import { Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import { actions } from "../../../../store/slices/ToasterSlice"

const PasswordForm = ({ errors, messages, routes }) => {

    const dispatch = useDispatch()

    const { data, setData, patch, processing } = useForm('PasswordForm', {
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
            onError: () => dispatch(actions.showError({
                message: messages.error
            }))
        })
    }

    return (
        <Card key="Password Form Card" sx={{ mt: 2 }}>
            <form onSubmit={handleSubmit}>
                <CardContent sx={{ p: 4 }}>
                    <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>Update Password</Typography>
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
