import { Link } from "@inertiajs/inertia-react";
import { Menu as MenuIcon } from "@mui/icons-material"
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material"
import { useState } from "react"

const Navbar = (props) => {

    const [showDrawer, setShowDrawer] = useState(false);

    const navItems = [
        {
            name: 'Home',
            link: '/'
        },
        {
            name: 'Browse Classes',
            link: '/'
        },
        {
            name: 'Inquiries',
            link: '/inquiries'
        }
    ]

    const drawerWidth = 240

    const { window } = props

    const container = window !== undefined ? () => window().document.body : undefined;

    const toggleDrawer = () => {
        setShowDrawer(!showDrawer)
    }

    const drawer = (
        <Box onClick={toggleDrawer} sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ textAlign: "center", my: 4 }}>L-Earning Bazaar</Typography>
            <Divider />
            <List>
                {navItems.map(item => (
                    <ListItem key={item.name} disablePadding>
                        <ListItemButton>
                            <ListItemText primary={item.name} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    )

    const nav = (
        navItems.map(item => (
            <Box key={item.name} sx={{ mr: 2 }}>
                <Link
                    key={item.name}
                    href={item.link}
                    style={{
                        textDecoration: 'none',
                        color: 'white'
                    }}
                >{item.name}</Link>
            </Box>
        ))
    )

    return (
        <>
            <AppBar position="static" color="primary">
                <Toolbar>
                    <Typography variant="h6" sx={{ my: 3, mr: 4 }}>L-Earning Bazaar</Typography>
                    <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                        { nav }
                    </Box>
                    <IconButton
                        color="inherit"
                        sx={{
                            display: {xs: "flex", sm: "none"},
                            marginLeft: "auto"
                        }}
                        onClick={toggleDrawer}
                    >
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Box>
                <Drawer
                    container={container}
                    variant="temporary"
                    open={showDrawer}
                    onClose={toggleDrawer}
                    ModalProps={{
                        keepMounted: true
                    }}
                    sx={{
                        display: { xs: "block", sm: "none" },
                        "& .MuiDrawer-paper": { boxSizing: 'border-box', width: drawerWidth }
                    }}
                >
                    {drawer}
                </Drawer>
            </Box>
        </>
    )
}

export default Navbar
