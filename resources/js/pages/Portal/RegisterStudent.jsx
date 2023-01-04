import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Divider, Grid, TextField, Typography, FormControl, FormControlLabel, FormLabel, RadioGroup, Radio } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import Input from "../../components/forms/Input"
import routes from "../../helpers/routes.helper"
import { displaySelectOptions } from "../../helpers/form.helper"
import React,{useState} from "react"

const RegisterStudent  = ({ countries, errors }) => {

    const dispatch = useDispatch()

    const { data, setData, post, processing, reset, clearErrors } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        country_id: '',
        password: '',
        password_confirmation: '',
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post(routes["register.store"], {
            onSuccess: () => {
                reset()
                clearErrors()

                dispatch(actions.success({
                    open: true,
                    type: 'success',
                    message: 'Student is successfully registered'
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
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <form method="POST" onSubmit={handleSubmit}>
                                    <Typography variant="h5">Sign Up</Typography>
                                    <Divider sx={{ my: 2 }} />

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                          <Input
                                              label="First Name"
                                              name="first_name"
                                              value={data.first_name}
                                              onChange={handleOnChange}
                                              errors={errors}
                                          />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Input
                                                label="Last Name"
                                                fullWidth
                                                name="last_name"
                                                defaultValue={data.last_name}
                                                onChange={handleOnChange}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item xs={12} >
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
                                        <Grid item xs={12}>
                                            <Input
                                                label="Email"
                                                fullWidth
                                                name="email"
                                                defaultValue={data.email}
                                                onChange={handleOnChange}
                                                errors={errors}
                                            />
                                        </Grid>

                                        <Grid item xs={12}>
                                            <Input
                                                label="Password"
                                                type="password"
                                                fullWidth
                                                name="password"
                                                defaultValue={data.password}
                                                onChange={handleOnChange}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Input
                                                label="Confirm Password"
                                                type="password"
                                                fullWidth
                                                name="password_confirmation"
                                                defaultValue={data.password_confirmation}
                                                onChange={handleOnChange}
                                                errors={errors}
                                            />
                                        </Grid>
                                        <Grid item xs={12} textAlign="center">
                                            <Button
                                                alignitems="center"
                                                onClick={handleSubmit}
                                                variant="contained"
                                                disabled={processing}
                                                type="submit"
                                            >SUBMIT</Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default RegisterStudent
