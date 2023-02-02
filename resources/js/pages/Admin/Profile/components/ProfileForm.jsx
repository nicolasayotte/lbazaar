import { useForm } from "@inertiajs/inertia-react"
import { Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../components/forms/Input"
import { handleOnChange, displaySelectOptions } from "../../../../helpers/form.helper"
import { actions } from "../../../../store/slices/ToasterSlice"

const ProfileForm = ({ errors, auth, countries, translatables, routes }) => {

    const dispatch = useDispatch()

    const { data, setData, patch, processing } = useForm('ProfileForm', {
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        email: auth.user.email,
        country_id: auth.user.country_id
    })

    const handleSubmit = e => {
        e.preventDefault()

        patch(routes["admin.profile.update"], {
            preserveScroll: true,
            errorBag: 'profile',
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.profile
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    return (
        <Card key="Profile Form Card">
            <form onSubmit={handleSubmit}>
                <CardContent sx={{ p: 4 }}>
                    <Typography
                        fontFamily="inherit"
                        variant="h5"
                        component="div"
                        sx={{ mb: 4 }}
                        children={translatables.texts.edit_profile}
                    />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Input
                                label={translatables.texts.first_name}
                                name="first_name"
                                value={data.first_name}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label={translatables.texts.last_name}
                                name="last_name"
                                value={data.last_name}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                label={translatables.texts.email}
                                disabled
                                name="email"
                                value={data.email}
                                onChange={e => handleOnChange(e, setData)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                label={translatables.texts.country}
                                select
                                name="country_id"
                                value={data.country_id}
                                onChange={e => handleOnChange(e, setData)}
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
                                children={translatables.texts.update_profile}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </form>
        </Card>
    )
}

export default ProfileForm
