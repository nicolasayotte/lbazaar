import { Link } from "@inertiajs/inertia-react"
import { Menu } from "@mui/icons-material"
import { AppBar, Box, Button, Divider, Drawer, Grid, IconButton, List, ListItem, ListItemButton, Toolbar, Typography } from "@mui/material"
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
            <Toolbar>
                <Typography variant="h6" textAlign="center">ADMIN</Typography>
            </Toolbar>
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
            <Toolbar>
                <Typography variant="h6" textAlign="center">ADMIN</Typography>
            </Toolbar>
            <Divider />
            <List>
                {menu}
                <Divider sx={{ my: 1 }} />
                <ListItem key="profile">
                    <ListItemButton>
                        <Link href="/admin/profile">Profile</Link>
                    </ListItemButton>
                </ListItem>
                <ListItem key="sign out">
                    <ListItemButton>Sign Out</ListItemButton>
                </ListItem>
            </List>
        </Drawer>
    )

    return (
        <>
            <AppBar
                position="static"
                color="primary"
                sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}
            >
                <Toolbar>
                    <Typography
                        variant="h6"
                        textAlign="center"
                        sx={{ display: { xs: 'inline-block', md: 'none' } }}
                    >ADMIN</Typography>
                    <Box sx={{ ml: 'auto' }}>
                        <Grid container sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <Grid item>
                                <ListItemButton>
                                    <Link as="span" href="/admin/profile">Profile</Link>
                                </ListItemButton>
                            </Grid>
                            <Grid item>
                                <ListItemButton>Sign Out</ListItemButton>
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
