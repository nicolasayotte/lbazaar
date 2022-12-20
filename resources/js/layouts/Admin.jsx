import { usePage } from "@inertiajs/inertia-react"
import { Container } from "@mui/material"
import { Box } from "@mui/system"
import { useState } from "react"
import AdminNavbar from "../components/includes/AdminNavbar"
import Toaster from "../components/includes/Toaster"

const Admin = ({children}) => {

    const [drawerWidth, setDrawerWidth] = useState(280)

    const { isLoggedIn } = usePage().props

    const Layout = ({ children }) => {

        if (isLoggedIn) {
            return (
                <>
                    <AdminNavbar
                        drawerWidth={drawerWidth}
                        setDrawerWidth={setDrawerWidth}
                    />
                    <Box
                        sx={{
                            paddingLeft: { xs: 0, md: `${ drawerWidth }px` },
                            paddingY: 2
                        }}
                    >
                        <Container>
                            {children}
                        </Container>
                    </Box>
                    <Toaster />
                </>
            )
        }

        return (
            <>
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
