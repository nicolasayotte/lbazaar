
import routes from "../../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "../../../../components/common/forms/PasswordForm"
import UserPoints from "../../../../components/cards/UserPoints"
import { Grid } from "@mui/material"

const Index = ({ auth, countries, errors, translatables }) => {
    return (
        <Grid container spacing={1}>
            <Grid item xs={12} md={8}>
                <ProfileForm
                    auth={auth}
                    countries={countries}
                    errors={errors.profile}
                    messages={translatables}
                    routes={routes}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <UserPoints
                    translatables={translatables}
                    user={auth.user}
                />
            </Grid>
            <Grid item xs={12} md={8}>
                <PasswordForm
                    errors={errors.passwords}
                    messages={translatables}
                    routes={routes}
                    logoutUrl='portal.logout'
                />
            </Grid>
        </Grid>
    )
}

export default Index
