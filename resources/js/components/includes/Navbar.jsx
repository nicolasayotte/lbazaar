import { Menu as MenuIcon } from "@mui/icons-material"
import { AppBar, Box, Button, Container, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from "@mui/material"
import { useState } from "react"

const Navbar = (props) => {

    const [showDrawer, setShowDrawer] = useState(false);

    const navItems = ["Home", "Browse Classes", "Inquiry"]

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
                    <ListItem key={item} disablePadding>
                        <ListItemButton>
                            <ListItemText primary={item} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    )

    return (
        <>
            <AppBar position="static" color="primary">
                <Toolbar>
                    <Typography variant="h6" sx={{ my: 3, mr: 4 }}>L-Earning Bazaar</Typography>
                    <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                        {navItems.map(item => (
                            <Button key={item} color="inherit">{item}</Button>
                        ))}
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
