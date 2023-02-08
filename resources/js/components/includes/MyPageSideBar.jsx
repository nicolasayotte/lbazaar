
import routes from "../../helpers/routes.helper"
import { Typography, Container, Box, Grid, Card, List, IconButton, Drawer, ListItem, ListItemButton, ListItemIcon, Stack, Toolbar, Divider} from "@mui/material"
import { Article, Logout, History, MenuBook, ManageAccounts, Menu } from "@mui/icons-material"
import { useState } from "react"
import { Link, usePage } from "@inertiajs/inertia-react"

const MyPage = ({ page }) => {

    const { component } = usePage()

    const container = page.props.window !== undefined ? () => window().document.body : undefined;

    const myPageTitle = page.props.title !== undefined ? page.props.title  : 'My Page';

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const drawerWidth = 300

    const toggleMobileDrawer = () => {
        setopenMobileDrawer(!openMobileDrawer)
    }

    const navItems = [
        {
            name: 'Profile',
            link: routes["mypage.profile.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/Profile'),
            icon: <ManageAccounts />
        },
        {
            name: 'Class Application',
            link: routes["mypage.course.applications.index"],
            roles: ['teacher'],
            active: component.startsWith('Portal/MyPage/ClassApplication'),
            icon: <Article />,
        },
        {
            name: 'Manage Classes',
            link: routes["mypage.course.manage_class.index"],
            roles: ['teacher'],
            active: component.startsWith('Portal/MyPage/ManageClass'),
            icon: <MenuBook />,
        },
        {
            name: 'Class History',
            link: routes["mypage.course.history.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/CourseHistory'),
            icon: <History />,
        }
    ]

    const menu = navItems.map(item => {
        let isAccessible = page.props.auth.user.roles.some(role => {
            return item.roles.includes(role.name);
        });

        if (isAccessible) {
            return (
                <ListItem key={item.name}>
                    <ListItemButton selected={item.active}>
                        {
                            item.icon && !openMobileDrawer &&
                            <ListItemIcon children={item.icon} />
                        }
                        <Link
                            as="span"
                            href={item.link}
                            children={item.name}
                            style={{ width: '100%' }}
                        />
                    </ListItemButton>
                </ListItem>
            )
        }
    })

    const logoutBtn = (
        <ListItemButton>
            <ListItemIcon children={<Logout />} />
            <Link
                as="span"
                method="post"
                href={routes["admin.logout"]}
                children="Sign Out"
            />
        </ListItemButton>
    )

    const sidebarLink = (
        <List>
            {menu}
            {
                !openMobileDrawer &&
                <ListItem>
                    {logoutBtn}
                </ListItem>
            }
        </List>
    )

    const mobileDrawer = (
        <Box onClick={toggleMobileDrawer}>
            <Drawer
                variant="temporary"
                anchor="left"
                container={container}
                open={openMobileDrawer}
                onClose={toggleMobileDrawer}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                <Toolbar>
                    <Typography variant="h5" py={3} children="My Page" />
                </Toolbar>
                <Divider />
                {sidebarLink}
            </Drawer>
        </Box>
    )

    return (
        <Box sx={{ minHeight: { xs: '100vh', lg: '83.7vh' } }}>
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography
                            variant="h5"
                            sx={{ mt: 3, display: { xs: 'none', md: 'inline-block' } }}
                            children={myPageTitle}
                        />
                    </Grid>
                    <Grid item xs={3}>
                        <Card sx={{ display: { xs: 'none', md: 'block' } }} children={sidebarLink} />
                    </Grid>
                    <Grid className="myprofile-card" item xs={12} md={9}>
                        <Stack direction="row" alignItems="center">
                            <IconButton
                                sx={{ display: { xs: 'block', md: 'none' } }}
                                onClick={toggleMobileDrawer}
                            >
                                <Menu color="inherit" />
                            </IconButton>
                            <Typography
                                variant="h6"
                                children={myPageTitle}
                                gutterBottom
                                sx={{ display: { xs: 'block', md: 'none' } }}
                            />
                        </Stack>
                        {page}
                    </Grid>
                </Grid>
                {mobileDrawer}
            </Container>
        </Box>
    )
}

export default MyPage
