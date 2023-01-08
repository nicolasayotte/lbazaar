
import routes from "../../../../helpers/routes.helper"
import MyPage from "../../../../layouts/MyPage"

const Index = ({ auth, countries, errors, messages, window }) => {

    const content = (
        <>
           
        </>
    )

    return (
        <MyPage 
            auth={auth} 
            countries={countries} 
            errors={errors} 
            messages={messages} 
            window={window} 
            content={content}>
        </MyPage>
    )
}

export default Index
