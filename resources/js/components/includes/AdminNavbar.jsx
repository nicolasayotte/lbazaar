import { Link } from "@inertiajs/inertia-react"
import { Menu } from "@mui/icons-material"
import { AppBar, Box, Divider, Drawer, Grid, IconButton, List, ListItem, ListItemButton, Toolbar, Typography } from "@mui/material"
import { useState } from "react"

const AdminNavbar = ({ drawerWidth, setDrawerWidth, window }) => {

    const container = window !== undefined ? () => window().document.body : undefined;

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const toggleMobileDrawer = () => {
        setopenMobileDrawer(!openMobileDrawer)
    }

    const navItems = [
        'Class Applications',
        'Class List',
        'Manage Users',
        'Inquiries',
        'Settings'
    ]

    const menu = (
        <>
            {navItems.map(item => (
                <ListItem key={item}>
                    <ListItemButton>{item}</ListItemButton>
                </ListItem>
            ))}
        </>
    )

    const logoutBtn = (
        <ListItemButton>
            <Link as="span" method="post" href="/admin/logout">Sign Out</Link>
        </ListItemButton>
    )

    const profileBtn = (
        <ListItemButton>
            <Link as="span" href="/admin/profile">Profile</Link>
        </ListItemButton>
    )

    const desktopDrawer = (
        <Drawer
            variant="permanent"
            anchor="left"
            container={container}
            open
            sx={{
                display: { xs: 'none', md: 'block' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
            }}
        >
            <Toolbar />
            <Divider />
            <List>
                {menu}
            </List>
        </Drawer>
    )

    const mobileDrawer = (
        <Drawer
            variant="temporary"
            anchor="left"
            container={container}
            open={openMobileDrawer}
            onClose={toggleMobileDrawer}
            ModalProps={{
                keepMounted: true
            }}
            sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
        >
            <Toolbar />
            <Divider />
            <List>
                {menu}
                <Divider sx={{ my: 1 }} />
                <ListItem key="profile">
                    {profileBtn}
                </ListItem>
                <ListItem>
                    {logoutBtn}
                </ListItem>
            </List>
        </Drawer>
    )

    return (
        <>
            <AppBar
                position="sticky"
                color="primary"
                sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        textAlign="center"
                    >ADMIN</Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <Grid container sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <Grid item>
                                {profileBtn}
                            </Grid>
                            <Grid item>
                                {logoutBtn}
                            </Grid>
                        </Grid>
                        <IconButton
                            color="white"
                            sx={{ display: { xs: 'inline-block', md: 'none' } }}
                            onClick={toggleMobileDrawer}
                        >
                            <Menu color="inherit" />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            {desktopDrawer}
            {mobileDrawer}
        </>
    )
}

export default AdminNavbar
