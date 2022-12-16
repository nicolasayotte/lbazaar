import { Container } from "@mui/material"
import { Box } from "@mui/system"
import { useState } from "react"
import AdminNavbar from "../components/includes/AdminNavbar"

const Admin = ({children}) => {

    const [drawerWidth, setDrawerWidth] = useState(280)

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
        </>
    )
}

export default Admin
