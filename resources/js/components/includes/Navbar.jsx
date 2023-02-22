import { Link, usePage } from "@inertiajs/inertia-react";
import { Menu as MenuIcon } from "@mui/icons-material"
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Stack, Toolbar, Typography, Grid, Tooltip } from "@mui/material"
import { useState } from "react"
import routes from "../../helpers/routes.helper"
import PointsIcon from '@mui/icons-material/WorkspacePremium'

const Navbar = () => {

    const { isLoggedIn, auth, window, translatables } = usePage().props

    const [showDrawer, setShowDrawer] = useState(false);

    const drawerWidth = 300

    const container = window !== undefined ? () => window().document.body : undefined;

    const toggleDrawer = () => {
        setShowDrawer(!showDrawer)
    }

    const navItems = [
        {
            name: 'Home',
            link: '/'
        },
        {
            name: 'Browse Classes',
            link: routes["course.index"]
        },
        {
            name: 'Inquiries',
            link: routes["inquiries.index"]
        }
    ]

    const authNavItems = [
        {
            name: 'Sign Up',
            link: routes["register.index"],
            auth: false
        },
        {
            name: 'Sign In',
            link: routes["portal.login"],
            auth: false
        },
        {
            name: 'Profile',
            link: routes["mypage.profile.index"],
            auth: true
        },
        {
            name: 'Sign Out',
            link: routes["portal.logout"],
            auth: true,
            method: 'POST'
        }
    ]

    const authButtons = (isLoggedIn, ParentComponent = null, parentProps = {}) => authNavItems.map(item => {

        const itemProps = item.method && { method: item.method }

        const output = (
            <Link
                as="div"
                style={{
                    cursor: 'pointer',
                    width: '100%',
                    minWidth: '100px',
                    textAlign: 'center'
                }}
                href={item.link}
                key={item.name}
                {...itemProps}
            >
                <ListItemButton>
                    <ListItemText primary={item.name} sx={{ textAlign: { xs: 'left', md: 'center' } }} />
                </ListItemButton>
            </Link>
        )

        if (isLoggedIn === item.auth) {
            return ParentComponent
            ? <ParentComponent {...parentProps} key={item.name} children={output} />
            : output
        }
    })

    const drawer = (
        <Box onClick={toggleDrawer}>
            <Toolbar>
                <Typography
                    variant="h5"
                    py={3}
                    children="L-Earning Bazaar"
                />
            </Toolbar>
            <Divider />

            <List>
                { isLoggedIn && (
                    <ListItem disablePadding>
                        <ListItemButton>
                        <Tooltip title={`${translatables.texts.points}`}>
                            <Grid container spacing={0} alignItems={'center'}>
                                <Grid item >
                                    <PointsIcon sx={{ color: '#FF6B09' }}/>
                                </Grid>
                                <Grid item>
                                    <Typography
                                        sx={{ color: '#FF6B09' }}
                                        variant="subtitle2"
                                        children={`${auth.user.user_wallet.points}`}
                                    />
                                </Grid>
                            </Grid>
                        </Tooltip>
                        </ListItemButton>
                    </ListItem>
                 )}
                {navItems.map(item => (
                    <ListItem key={item.name} disablePadding>
                        <Link href={item.link} style={{ width: '100%' }}>
                            <ListItemButton>
                                <ListItemText primary={item.name} />
                            </ListItemButton>
                        </Link>
                    </ListItem>
                ))}
                { authButtons(isLoggedIn, ListItem, {disablePadding: true}) }
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

    const appNavbar = document.getElementById('appNavbar');

    return (
        <>
            <AppBar position="fixed" color="primary" id="appNavbar">
                <Toolbar>
                    <Typography variant="h6" sx={{ my: 3, mr: 4 }}>L-Earning Bazaar</Typography>
                    <Box sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" } }}>
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
                    <Stack display={{ xs: 'none', md: 'flex' }} direction="row" spacing={1}>
                        { isLoggedIn && (
                            <Tooltip title={`${translatables.texts.points}`}>
                                <Grid container spacing={1} alignItems={'center'}>
                                    <Grid item >
                                        <PointsIcon/>
                                    </Grid>
                                    <Grid item>
                                        <Typography
                                            variant="subtitle2"
                                            children={`${auth.user.user_wallet.points}`}
                                        />
                                    </Grid>
                                </Grid>
                            </Tooltip>
                        )}
                        { authButtons(isLoggedIn) }
                    </Stack>
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
            <Box sx={{ height: appNavbar && appNavbar.clientHeight + 'px' }} />
        </>
    )
}

export default Navbar
