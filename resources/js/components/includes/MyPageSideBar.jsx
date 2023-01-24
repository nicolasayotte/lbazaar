
import routes from "../../helpers/routes.helper"
import { Typography, Container, Box, Grid, Card, List, IconButton, Drawer, ListItem, ListItemButton, ListItemIcon} from "@mui/material"
import { Article, Logout, History, MenuBook, ManageAccounts, Menu } from "@mui/icons-material"
import { useState } from "react"
import { Link, usePage } from "@inertiajs/inertia-react"

const MyPage = ({ page }) => {

    const { component } = usePage()

    const container = page.props.window !== undefined ? () => window().document.body : undefined;

    const myPageTitle = page.props.title !== undefined ? page.props.title  : 'My Page';

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const drawerWidth = 240

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
            name: 'Class Histories',
            link: routes["mypage.course.history.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/CourseHistory'),
            icon: <History />,
        }
    ]

    const menu = (
        <>
            {navItems.map(item => {
                let isAccessible = page.props.auth.user.roles.some(role => {
                    return item.roles.includes(role.name);
                  });
                return isAccessible ?
                        <ListItem key={item.name}>
                            <ListItemButton selected={item.active}>
                                {
                                    item.icon &&
                                    <ListItemIcon children={item.icon} />
                                }
                                <Link
                                    as="span"
                                    href={item.link}
                                    children={item.name}
                                    style={{
                                        width: '100%'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    :
                       null
            })}
        </>
    )

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
        <>
            <List>
                {menu}
                <ListItem>
                    {logoutBtn}
                </ListItem>
            </List>
        </>
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
           {sidebarLink}
        </Drawer>
    )

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container sx={{mt: 4}}>
                    <Grid item xs={10} sm={3} md={3} lg={3}>
                        <Typography variant="h6" sx={{mb: 2, display: { xs: 'none', sm: 'none', md: 'inline-block' } }}>
                            {myPageTitle}
                        </Typography>
                        <Card sx={{ minWidth: '250px', display: { xs: 'none', sm: 'none', md: 'inline-block' } }}>
                            {sidebarLink}
                        </Card>
                    </Grid>
                    <Grid className="myprofile-card" item xs={12} sm={12} md={9} lg={9}>
                        <Grid container>
                            <IconButton
                                    color="white"
                                    sx={{ display: { xs: 'inline-block', sm: 'inline-block', md: 'none' } }}
                                    onClick={toggleMobileDrawer}
                                >
                                    <Menu color="inherit" />
                                </IconButton>
                                <Typography
                                    variant="h6"
                                    children={myPageTitle}
                                    gutterBottom
                                    sx={{ display: { xs: 'inline-block', sm: 'inline-block', md: 'none' } }}
                                />
                            {page}
                        </Grid>
                    </Grid>
                </Grid>
                {mobileDrawer}
            </Container>
        </Box>
    )
}

export default MyPage
