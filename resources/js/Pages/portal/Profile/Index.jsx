
import routes from "../../../helpers/routes.helper"
import { Typography, Container, Box, Grid, Card, CardContent, List, Divider, IconButton, Drawer, Toolbar, ListItem, ListItemButton} from "@mui/material"
import { useState } from "react"
import { Menu } from "@mui/icons-material"
import { Link } from "@inertiajs/inertia-react"
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
            countries={countries} 
            errors={errors} 
            messages={messages} 
            window={window} 
            content={content}>
        </MyPage>
    )
}

export default Index
