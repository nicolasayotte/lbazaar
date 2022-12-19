import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, TextField, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../components/form/Input"
import { actions } from "../../store/slices/ToasterSlice"

const Profile = ({ auth, countries, errors }) => {

    const dispatch = useDispatch()

    const { data, setData, post, processing } = useForm({
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        email: auth.user.email,
        country_id: auth.user.country_id
    })

    const countryOptions = Object.keys(countries).map(key =>
        <option value={key} key={key}>{countries[key]}</option>
    )

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
            <Typography fontFamily="inherit" variant="h4" sx={{ mb: 2 }}>Profile</Typography>
            <Card>
                <form onSubmit={handleSubmit}>
                    <CardContent sx={{ p: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="First Name"
                                    fullWidth
                                    name="first_name"
                                    value={data.first_name}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Input
                                    label="Last Name"
                                    fullWidth
                                    name="last_name"
                                    value={data.last_name}
                                    onChange={handleOnChange}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label="Email"
                                    fullWidth
                                    disabled
                                    name="email"
                                    value={data.email}
                                    onChange={handleOnChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Country"
                                    fullWidth
                                    select
                                    SelectProps={{
                                        native: true,
                                    }}
                                    name="country_id"
                                    value={data.country_id}
                                    onChange={handleOnChange}
                                >
                                    {countryOptions}
                                </TextField>
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
