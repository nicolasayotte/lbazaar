import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Divider, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import { actions } from "../../store/slices/ToasterSlice"
import { displaySelectOptions } from "../../components/helpers/form.helper"

const Profile = ({ auth, countries, errors, messages }) => {

    const dispatch = useDispatch()

    const { data: profile, setData: setProfile, post: profileRequest, processing: profileProcessing } = useForm('ProfileForm', {
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        email: auth.user.email,
        country_id: auth.user.country_id
    })

    const { data: passwords, setData: setPasswords, post: passwordRequest, processing: passwordProcessing } = useForm('PasswordForm', {
        current_password: '',
        new_password: '',
        confirm_password: ''
    })

    const onChangeSetters = {
        setProfile,
        setPasswords
    }

    const handleOnChange = (e, setMethod) => {
        onChangeSetters[setMethod](e.target.name, e.target.value)
    }

    const handleProfileSubmit = (e) => {
        e.preventDefault()

        profileRequest('/admin/profile', {
            onSuccess: () => dispatch(actions.showSuccess({
                message: messages.success.profile
            })),
            onError: () => dispatch(actions.showError({
                message: messages.error
            }))
        })
    }

    return (
        <Box>
            <Card key="Profile Form Card">
                <form onSubmit={handleProfileSubmit}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>Edit Profile</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="First Name"
                                    name="first_name"
                                    value={profile.first_name}
                                    onChange={e => handleOnChange(e, 'setProfile')}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="Last Name"
                                    name="last_name"
                                    value={profile.last_name}
                                    onChange={e => handleOnChange(e, 'setProfile')}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label="Email"
                                    disabled
                                    name="email"
                                    value={profile.email}
                                    onChange={e => handleOnChange(e, 'setProfile')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label="Country"
                                    select
                                    name="country_id"
                                    value={profile.country_id}
                                    onChange={e => handleOnChange(e, 'setProfile')}
                                    errors={errors}
                                >
                                    {displaySelectOptions(countries)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} textAlign="right">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    onClick={handleProfileSubmit}
                                    disabled={profileProcessing}
                                >Update</Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </form>
            </Card>
            <Card key="Password Form Card" sx={{ mt: 2 }}>
                <form>
                    <CardContent sx={{ p: 4 }}>
                        <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>Update Password</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Input
                                    type="password"
                                    label="Current Password"
                                    name="current_password"
                                    data={passwords.current_password}
                                    helperText="Enter your current password for verification"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    type="password"
                                    label="New Password"
                                    name="new_password"
                                    data={passwords.new_password}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    type="password"
                                    label="Confirm Password"
                                    name="confirm_password"
                                    data={passwords.confirm_password}
                                />
                            </Grid>
                            <Grid item xs={12} textAlign="right">
                                <Button
                                    variant="contained"
                                >Update Password</Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </form>
            </Card>
        </Box>
    )
}

export default Profile
