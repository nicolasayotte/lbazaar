
import routes from "../../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "../../../../components/common/forms/PasswordForm"
import { Box } from "@mui/material"

const Index = ({ auth, countries, errors, messages }) => {

    return (
        <>
            <Box sx={{mt:6}}>
                <ProfileForm
                    auth={auth}
                    countries={countries}
                    errors={errors.profile}
                    messages={messages}
                    routes={routes}
                />
                <PasswordForm
                    errors={errors.passwords}
                    messages={messages}
                    routes={routes}
                    logoutUrl='portal.logout'
                />
            </Box>
        </>
    )
}

export default Index
