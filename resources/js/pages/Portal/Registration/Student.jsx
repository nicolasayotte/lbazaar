import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Divider, Grid, Typography } from "@mui/material"
import { actions } from '../../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import Input from "../../../components/forms/Input"
import routes from "../../../helpers/routes.helper"
import { displaySelectOptions } from "../../../helpers/form.helper"
import { Link } from "@inertiajs/inertia-react"

const Student  = () => {

    const dispatch = useDispatch()

    const { countries, translatables } = usePage().props

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
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
            onError: () => dispatch(actions.error({
                    open: true,
                    type: 'error',
                    message: translatables.error
            }))
        });
    }

    return (
        <Container>
            <Grid container alignItems="center" minHeight="100vh" >
                <Grid item xs={12} md={5} mx="auto" py={5}>
                    <Typography variant="h5" sx={{ mb: 2 }}>{translatables.texts.sign_up_student}</Typography>
                    <Card>
                        <CardContent sx={{ p: 3 }}>
                            <form method="POST" onSubmit={handleSubmit}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Input
                                            label={translatables.texts.first_name}
                                            name="first_name"
                                            value={data.first_name}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Input
                                            label={translatables.texts.last_name}
                                            fullWidth
                                            name="last_name"
                                            defaultValue={data.last_name}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12} >
                                        <Input
                                        label={translatables.texts.country}
                                        select
                                        name="country_id"
                                        value={data.country_id}
                                        onChange={handleOnChange}
                                        errors={errors}
                                        >
                                        <option value=""></option>
                                        {displaySelectOptions(countries)}
                                        </Input>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.email}
                                            fullWidth
                                            name="email"
                                            defaultValue={data.email}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.password}
                                            type="password"
                                            fullWidth
                                            name="password"
                                            defaultValue={data.password}
                                            onChange={handleOnChange}
                                            errors={errors}
                                            helperText={translatables.texts.password_help}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label={translatables.texts.confirm_password}
                                            type="password"
                                            fullWidth
                                            name="password_confirmation"
                                            defaultValue={data.password_confirmation}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12} textAlign="right">
                                        <Button
                                            alignitems="center"
                                            onClick={handleSubmit}
                                            variant="contained"
                                            disabled={processing}
                                            type="submit"
                                            children={translatables.texts.submit}
                                        />
                                    </Grid>
                                </Grid>
                            </form>
                        </CardContent>
                    </Card>
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Link href={routes["portal.login"]}>
                            <Button children={translatables.texts.back_to_sign_in} />
                        </Link>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Student
