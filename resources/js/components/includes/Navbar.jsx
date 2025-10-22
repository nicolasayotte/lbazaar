import { Link, usePage } from "@inertiajs/inertia-react";
import { AccountBalanceWallet, Menu as MenuIcon } from "@mui/icons-material"
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemText, Stack, Toolbar, Typography, Button } from "@mui/material"
import { useState } from "react"
import routes from "../../helpers/routes.helper"
import LanguageNavbar from "./LanguageNavbar"

const Navbar = () => {

    const { isLoggedIn, auth, window, translatables, locale } = usePage().props

    const [showDrawer, setShowDrawer] = useState(false);

    const drawerWidth = 300

    const container = window !== undefined ? () => window().document.body : undefined;

    const toggleDrawer = () => {
        setShowDrawer(!showDrawer)
    }

    const navItems = [
        {
            name: `${translatables.texts.home}`,
            link: '/'
        },
        {
            name: `${translatables.texts.browse_classes}`,
            link: routes["course.index"]
        },
        {
            name: `${translatables.title.inquiries.index}`,
            link: routes["inquiries.index"]
        }
    ]

    const authNavItems = [
        {
            name: `${translatables.texts.sign_up}`,
            link: routes["register.index"],
            auth: false
        },
        {
            name: `${translatables.texts.sign_in}`,
            link: routes["portal.login"],
            auth: false
        },
        {
            name: `${translatables.texts.mypage}`,
            link: routes["mypage.profile.index"],
            auth: true
        },
        {
            name: `${translatables.texts.sign_out}`,
            link: routes["portal.logout"],
            auth: true,
            method: 'POST'
        }
    ]

    const authButtons = (isLoggedIn, ParentComponent = null, parentProps = {}, ButtonComponent = null) => authNavItems.map(item => {

        let itemProps = item.method && { method: item.method }

        const output = (
            <Link
                as="div"
                style={{
                    cursor: 'pointer',
                    width: '100%',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                }}
                href={item.link}
                key={item.name}
                {...itemProps}
            >
                {
                    ButtonComponent
                        ? <ButtonComponent variant="outlined" color="inherit" children={item.name} />
                        : (
                            <ListItemButton>
                                <ListItemText primary={item.name} sx={{ textAlign: { xs: 'left', md: 'center' } }} />
                            </ListItemButton>
                        )
                }
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
                <img src="https://staging-lebazaar.s3.ap-northeast-1.amazonaws.com/uploads/logo-black.png" alt="Logo" style={{ padding: "12px", height: "80px" }} />
            </Toolbar>
            <Divider />
            <List>
                {
                    isLoggedIn && (
                        <>
                            {/*
                            <ListItem>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                                    <AccountBalanceWallet sx={{ mr: 'auto' }} />
                                    <Typography children={auth.user.user_wallet.points.toFixed(2)} />
                                </Stack>
                            </ListItem>
                            <Divider sx={{ my: 1 }} />
                            */}
                            <ListItem disablePadding>
                                <ListItemButton>
                                    <Typography
                                        variant="subtitle2"
                                        children={`${auth.user.roles[0].name.toUpperCase()}`}
                                    />
                                </ListItemButton>
                            </ListItem>
                            <Divider sx={{ my: 1 }} />
                        </>
                    )
                }
                {navItems.map(item => (
                    <ListItem key={item.name} disablePadding>
                        <Link href={item.link} style={{ width: '100%' }}>
                            <ListItemButton>
                                <ListItemText primary={item.name} />
                            </ListItemButton>
                        </Link>
                    </ListItem>
                ))}
                {authButtons(isLoggedIn, ListItem, { disablePadding: true })}
            </List>
        </Box>
    )

    const Nav = () => (
        navItems.map(item => (
            <Link
                key={item.name}
                href={item.link}
                style={{
                    textDecoration: 'none',
                    color: 'white'
                }}
            >
                <Button color="inherit" children={item.name} />
            </Link>
        ))
    )

    const appNavbar = document.getElementById('appNavbar');

    return (
        <>
            <AppBar position="fixed" color="primary" id="appNavbar">
                <LanguageNavbar locale={locale} />
                <Toolbar>
                    <img src="https://staging-lebazaar.s3.ap-northeast-1.amazonaws.com/uploads/logo.png" alt="Logo" style={{ padding: "12px", height: "80px" }} />
                    <Stack direction="row" spacing={1} sx={{ mr: 'auto', display: { xs: "none", md: "flex" } }}>
                        <Nav />
                    </Stack>
                    <IconButton
                        color="inherit"
                        sx={{
                            display: { xs: "flex", md: "none" },
                            marginLeft: "auto"
                        }}
                        onClick={toggleDrawer}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Stack display={{ xs: 'none', md: 'flex' }} direction="row" spacing={1}>
                        {
                            isLoggedIn && (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 2 }}>
                                    <Typography
                                        variant="subtitle2"
                                        children={`${auth.user.roles[0].name.toUpperCase()}`}
                                        sx={{ mr: 2 }}
                                    />
                                    {/*
                                    <AccountBalanceWallet />
                                    <Typography children={auth.user.user_wallet.points.toFixed(2)} />
                                    */}
                                </Stack>
                            )
                        }
                        {authButtons(isLoggedIn, null, {}, Button)}
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
                        display: { xs: "block", md: "none" },
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
