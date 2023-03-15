
import routes from "../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "../../../components/common/forms/PasswordForm"
import { Grid, Typography } from "@mui/material"
import { usePage } from "@inertiajs/inertia-react"

const Index = () => {

    const { auth, countries, errors, translatables } = usePage().props

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography
                        variant="h4"
                        children={translatables.texts.profile}
                    />
                </Grid>
                <Grid item xs={12}>
                    <ProfileForm
                        auth={auth}
                        countries={countries}
                        errors={errors.profile}
                        translatables={translatables}
                        routes={routes}
                    />
                </Grid>
                <Grid item xs={12}>
                    <PasswordForm
                        errors={errors.passwords}
                        messages={translatables}
                        routes={routes}
                        logoutUrl='admin.logout'
                    />
                </Grid>
            </Grid>
        </>
    )
}

export default Index
