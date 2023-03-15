import { Link, usePage } from "@inertiajs/inertia-react"
import { Wallet, AccountBalanceWallet, AccountCircle, Article, ExpandLess, ExpandMore, GTranslate, Inbox, LibraryBooks, LocalOffer, Logout, Mail, ManageAccounts, Menu, People, Settings, DisplaySettings } from "@mui/icons-material"
import { AppBar, Box, Collapse, Divider, Drawer, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Stack } from "@mui/material"
import { useState } from "react"
import routes from "../../helpers/routes.helper"
import LanguageNavbar from "./LanguageNavbar"

const AdminNavbar = ({ drawerWidth, window }) => {

    const { component } = usePage()

    const { locale, translatables, auth } = usePage().props

    const container = window !== undefined ? () => window().document.body : undefined;

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const [openSettings, setOpenSettings] = useState(component.startsWith('Admin/Settings'))

    const navbarHeight = '104px !important'

    const toggleMobileDrawer = () => {
        setopenMobileDrawer(!openMobileDrawer)
    }

    const navItems = [
        {
            name: translatables.title.class.applications.index,
            link: routes["admin.class.applications.index"],
            icon: <Article />,
            active: component.startsWith('Admin/ClassApplications')
        },
        {
            name: translatables.title.users.index,
            link: routes["admin.users.index"],
            icon: <People />,
            active: component.startsWith('Admin/Users')
        },
        {
            name: translatables.title.inquiries.index,
            link: routes["admin.inquiries.index"],
            icon: <Inbox />,
            active: component.startsWith('Admin/Inquiries')
        },
        {
            name: `${translatables.texts.wallet_history}`,
            link: routes["admin.wallet.index"],
            active: component.startsWith('Admin/WalletHistory'),
            icon: <Wallet />,
        }
    ]

    const settingsItems = [
        {
            name: translatables.title.categories,
            link: routes["admin.settings.categories.index"],
            icon: <LocalOffer />,
            active: component.startsWith('Admin/Settings/CourseCategories')
        },
        {
            name: translatables.title.class.types,
            link: routes["admin.settings.course_types.index"],
            icon: <LibraryBooks />,
            active: component.startsWith('Admin/Settings/CourseTypes')
        },
        {
            name: translatables.title.translations,
            link: routes["admin.settings.translations.index"],
            icon: <GTranslate />,
            active: component.startsWith('Admin/Settings/Translations')
        },
        {
            name: translatables.title.general,
            link: routes["admin.settings.general.index"],
            icon: <DisplaySettings />,
            active: component.startsWith('Admin/Settings/General')
        }
    ]

    const displayMenu = (list) => (
        <>
            {list.map(item => (
                <Link
                    key={item.name}
                    href={item.link}
                    style={{
                        width: '100%'
                    }}
                >
                    <ListItem>
                        <ListItemButton selected={item.active}>
                            {
                                item.icon &&
                                <ListItemIcon children={item.icon} />
                            }
                            <ListItemText primary={item.name} />
                        </ListItemButton>
                    </ListItem>
                </Link>
            ))}
        </>
    )

    const settingsMenu = (
        <>
            <ListItem>
                <ListItemButton onClick={() => { setOpenSettings(!openSettings) }}>
                    <ListItemIcon children={<Settings />} />
                    <ListItemText primary={translatables.title.settings}/>
                    {
                        openSettings
                        ? <ExpandLess />
                        : <ExpandMore />
                    }
                </ListItemButton>
            </ListItem>
            <Collapse in={openSettings} timeout="auto" unmountOnExit>
                <Divider />
                <List component="div" disablePadding>
                    {displayMenu(settingsItems)}
                </List>
            </Collapse>
        </>
    )

    const logoutBtn = (
        <Link
            as="span"
            method="post"
            href={routes["admin.logout"]}
            style={{ width: '100%' }}
        >
            <ListItemButton>
                <ListItemIcon children={<Logout />} sx={{ display: { md: 'none' } }} />
                <ListItemText primary={translatables.texts.sign_out} />
            </ListItemButton>
        </Link>
    )

    const profileBtn = (
        <Link
            href={routes["admin.profile.index"]}
            style={{ width: '100%' }}
        >
            <ListItemButton selected={component.startsWith('Admin/Profile')}>
                <ListItemIcon children={<AccountCircle />} sx={{ display: { md: 'none' } }} />
                <ListItemText primary={translatables.texts.mypage} />
            </ListItemButton>
        </Link>
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
            <Toolbar sx={{ minHeight: navbarHeight }} />
            <List>
                {displayMenu(navItems)}
                {settingsMenu}
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
            <Toolbar sx={{ minHeight: navbarHeight }}/>
            <List>
                <ListItem key="profile">
                    {profileBtn}
                </ListItem>
                <Divider sx={{ my: 1 }} />
                {displayMenu(navItems)}
                {settingsMenu}
                <Divider sx={{ my: 1 }} />
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
                id="admin-navbar"
            >
                <LanguageNavbar locale={locale} />
                <Toolbar>
                    <Typography
                        variant="h6"
                        textAlign="center"
                        textTransform="uppercase"
                        children={translatables.texts.admin}
                    />
                    <Box sx={{ ml: 'auto' }}>
                        <Grid container sx={{ display: { xs: 'none', md: 'flex' } }} alignItems={'center'}>
                            <Grid item>
                                <Box  display="flex" justifyContent="space-between" alignItems="center">
                                    <AccountBalanceWallet />
                                    <Typography children={ auth.user.user_wallet.points } />
                                </Box>
                            </Grid>
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
