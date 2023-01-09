
import routes from "../../../helpers/routes.helper"
import ProfileForm from "./components/ProfileForm"
import MyPage from "../../../layouts/MyPage"
import PasswordForm from "../../../components/common/forms/PasswordForm"

const Index = ({ auth, countries, errors, messages, window }) => {

    const content = (
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
                logoutUrl='portal.logout'
            />
        </>
    )

    return (
        <MyPage 
            auth={auth} 
            window={window} 
            content={content}
            title="My Page | Profile">
        </MyPage>
    )
}

export default Index
