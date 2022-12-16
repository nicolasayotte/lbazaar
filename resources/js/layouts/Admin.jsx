import { Container } from "@mui/material"
import { Box } from "@mui/system"
import { useState } from "react"
import AdminNavbar from "../components/includes/AdminNavbar"

const Admin = ({children}) => {

    const [drawerWidth, setDrawerWidth] = useState(300)

    return (
        <>
            <AdminNavbar
                drawerWidth={drawerWidth}
                setDrawerWidth={setDrawerWidth}
            />
            <Box sx={{ paddingLeft: { xs: 0, md: `${ drawerWidth }px` }}}>
                <Container>
                    {children}
                </Container>
            </Box>
        </>
    )
}

export default Admin
