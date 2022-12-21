
import routes from "../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import PasswordForm from "./components/PasswordForm"

const Index = ({ auth, countries, errors, messages }) => {
    return (
        <>
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
            />
        </>
    )
}

export default Index
