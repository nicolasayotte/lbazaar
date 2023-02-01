
import routes from "../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "../../../components/common/forms/PasswordForm"
import { Typography } from "@mui/material"
import { usePage } from "@inertiajs/inertia-react"

const Index = () => {

    const { auth, countries, errors, translatables } = usePage().props

    return (
        <>
            <Typography
                variant="h4"
                children={translatables.texts.profile}
                gutterBottom
            />
            <ProfileForm
                auth={auth}
                countries={countries}
                errors={errors.profile}
                translatables={translatables}
                routes={routes}
            />
            <PasswordForm
                errors={errors.passwords}
                messages={translatables}
                routes={routes}
                logoutUrl='admin.logout'
            />
        </>
    )
}

export default Index
