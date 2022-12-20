import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import { actions } from "../../store/slices/ToasterSlice"
import { displaySelectOptions } from "../../components/helpers/form.helper"

const Profile = ({ auth, countries, errors }) => {

    const dispatch = useDispatch()

    const { data, setData, post, processing } = useForm({
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        email: auth.user.email,
        country_id: auth.user.country_id
    })

    const handleOnChange = e => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post('/admin/profile', {
            onSuccess: response => {
                dispatch(actions.toggle({
                    open: true,
                    type: 'success',
                    message: 'Profile successfully updated'
                }))
            },
            onError: response => {
                dispatch(actions.toggle({
                    open: true,
                    type: 'error',
                    message: 'There was an error encountered'
                }))
            },
        })
    }

    return (
        <Box>
            <Card>
                <form onSubmit={handleSubmit}>
                    <CardContent sx={{ p: 4 }}>
                        <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>Profile</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="First Name"
                                    name="first_name"
                                    value={data.first_name}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="Last Name"
                                    name="last_name"
                                    value={data.last_name}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label="Email"
                                    disabled
                                    name="email"
                                    value={data.email}
                                    onChange={handleOnChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label="Country"
                                    select
                                    name="country_id"
                                    value={data.country_id}
                                    onChange={handleOnChange}
                                    errors={errors}
                                >
                                    {displaySelectOptions(countries)}
                                </Input>
                            </Grid>
                            <Grid item xs={12} textAlign="right">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                >Update</Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </form>
            </Card>
        </Box>
    )
}

export default Profile
