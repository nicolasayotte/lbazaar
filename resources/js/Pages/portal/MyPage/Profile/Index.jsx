
import routes from "../../../../helpers/routes.helper"
import ProfileForm from "../components/ProfileForm"
import PasswordForm from "../../../../components/common/forms/PasswordForm"
import { Box } from "@mui/material"

const Index = ({ auth, countries, errors, translatables }) => {
    return (
        <>
            <Box>
                <ProfileForm
                    auth={auth}
                    countries={countries}
                    errors={errors.profile}
                    messages={translatables}
                    routes={routes}
                />
                <PasswordForm
                    errors={errors.passwords}
                    messages={translatables}
                    routes={routes}
                    logoutUrl='portal.logout'
                />
            </Box>
        </>
    )
}

export default Index
