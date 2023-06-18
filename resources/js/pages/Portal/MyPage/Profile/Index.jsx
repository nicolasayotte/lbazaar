
import routes from "../../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "../../../../components/common/forms/PasswordForm"
import UserPoints from "../../../../components/cards/UserPoints"
import WalletConnector from "../../../../components/cards/WalletConnector"
import { Box, Grid } from "@mui/material"

const Index = ({ auth, countries, errors, translatables }) => {

    return (
        <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
                <Box mb={2}>
                    <ProfileForm
                        auth={auth}
                        countries={countries}
                        errors={errors.profile}
                        messages={translatables}
                        routes={routes}
                    />
                </Box>
                <PasswordForm
                    errors={errors.passwords}
                    messages={translatables}
                    routes={routes}
                    logoutUrl='portal.logout'
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <Box mb={2}>
                    <WalletConnector />
                </Box>
                <Box mb={2}>
                    <UserPoints />
                </Box>
                
            </Grid>

        </Grid>
    )
}

export default Index
