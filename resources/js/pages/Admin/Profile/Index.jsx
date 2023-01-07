
import routes from "../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "../../../components/common/forms/PasswordForm"
import { Typography } from "@mui/material"

const Index = ({ auth, countries, errors, messages }) => {
    return (
        <>
            <Typography
                variant="h4"
                children="Profile"
                gutterBottom
            />
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
                logoutUrl='admin.logout'
            />
        </>
    )
}

export default Index
