import { Link, usePage } from "@inertiajs/inertia-react"
import { Article, ExpandLess, ExpandMore, Inbox, LibraryBooks, LocalOffer, Mail, ManageAccounts, Menu, People, Settings } from "@mui/icons-material"
import { AppBar, Box, Collapse, Divider, Drawer, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from "@mui/material"
import { useState } from "react"
import routes from "../../helpers/routes.helper"

const AdminNavbar = ({ drawerWidth, window }) => {

    const { component } = usePage()

    const container = window !== undefined ? () => window().document.body : undefined;

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const [openSettings, setOpenSettings] = useState(component.startsWith('Admin/Settings'))

    const toggleMobileDrawer = () => {
        setopenMobileDrawer(!openMobileDrawer)
    }

    const navItems = [
        {
            name: 'Class Applications',
            link: routes["admin.class.applications.index"],
            icon: <Article />,
            active: component.startsWith('Admin/ClassApplications')
        },
        {
            name: 'Manage Users',
            link: routes["admin.users.index"],
            icon: <People />,
            active: component.startsWith('Admin/Users')
        },
        {
            name: 'Inquiries',
            link: routes["admin.inquiries.index"],
            icon: <Inbox />,
            active: component.startsWith('Admin/Inquiries')
        }
    ]

    const settingsItems = [
        {
            name: 'General Settings',
            link: '',
            icon: <Settings />
        },
        {
            name: 'Email Settings',
            link: '',
            icon: <Mail />
        },
        {
            name: 'Categories',
            link: routes["admin.settings.categories.index"],
            icon: <LocalOffer />,
            active: component.startsWith('Admin/Settings/CourseCategories')
        },
        {
            name: 'Class Types',
            link: routes["admin.settings.course_types.index"],
            icon: <LibraryBooks />,
            active: component.startsWith('Admin/Settings/CourseTypes')
        },
        {
            name: 'Classifications',
            link: routes["admin.settings.classifications.index"],
            icon: <ManageAccounts />,
            active: component.startsWith('Admin/Settings/Classifications')
        }
    ]

    const displayMenu = (list) => (
        <>
            {list.map(item => (
                <ListItem key={item.name}>
                    <ListItemButton selected={item.active}>
                        {
                            item.icon &&
                            <ListItemIcon children={item.icon} />
                        }
                        <Link
                            href={item.link}
                            children={item.name}
                            style={{
                                width: '100%'
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            ))}
        </>
    )

    const settingsMenu = (
        <>
            <ListItem>
                <ListItemButton onClick={() => { setOpenSettings(!openSettings) }}>
                    <ListItemIcon children={<Settings />} />
                    <ListItemText primary="Settings"/>
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
        >
            <ListItemButton children="Sign Out" />
        </Link>
    )

    const profileBtn = (
        <Link href={routes["admin.profile.index"]}>
            <ListItemButton children="Profile" />
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
            <Toolbar />
            <Divider />
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
            <Toolbar />
            <Divider />
            <List>
                {displayMenu(navItems)}
                {settingsMenu}
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
