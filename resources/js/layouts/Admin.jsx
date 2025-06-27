import { Head, usePage } from "@inertiajs/inertia-react"
import { Container, ThemeProvider } from "@mui/material"
import { Box } from "@mui/system"
import { useState } from "react"
import AdminNavbar from "../components/includes/AdminNavbar"
import Toaster from "../components/includes/Toaster"
import AdminTheme from "../themes/admin.theme"
import Meta from "../components/common/Meta"

const Admin = ({ children }) => {

    const [drawerWidth, setDrawerWidth] = useState(300)

    const { isLoggedIn } = usePage().props

    const Layout = ({ children }) => {

        if (isLoggedIn) {
            return (
                <>
                    <Meta />
                    <ThemeProvider theme={AdminTheme}>
                        <AdminNavbar
                            drawerWidth={drawerWidth}
                            setDrawerWidth={setDrawerWidth}
                        />
                        <Box
                            sx={{
                                paddingLeft: { xs: 0, md: `${drawerWidth}px` },
                                paddingY: 2
                            }}
                        >
                            <Container maxWidth={false}>
                                {children}
                            </Container>
                        </Box>
                        <Toaster />
                    </ThemeProvider>
                </>
            )
        }

        return (
            <>
                <Meta />
                {children}
                <Toaster />
            </>
        )
    }

    return (
        <Layout children={children} />
    )
}

export default Admin
