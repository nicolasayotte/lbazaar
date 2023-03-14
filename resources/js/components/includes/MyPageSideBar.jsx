
import routes from "../../helpers/routes.helper"
import { Typography, Box, Card, List, IconButton, Drawer, ListItem, ListItemButton, ListItemIcon, Stack, Toolbar, Divider} from "@mui/material"
import { Article, Logout, History, MenuBook, ManageAccounts, Menu, Wallet, LocalPolice as Badge, HistoryEdu as Teaching } from "@mui/icons-material"
import { useState } from "react"
import { Link, usePage } from "@inertiajs/inertia-react"

const MyPage = ({ window }) => {

    const { component } = usePage()
    const { translatables, title, auth } = usePage().props

    const container = window !== undefined ? () => window().document.body : undefined;

    const myPageTitle = title || 'My Page'

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const drawerWidth = 300

    const toggleMobileDrawer = () => {
        setopenMobileDrawer(!openMobileDrawer)
    }

    const navItems = [
        {
            name: `${translatables.texts.profile}`,
            link: routes["mypage.profile.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/Profile'),
            icon: <ManageAccounts />
        },
        {
            name: `${translatables.title.class.applications.view}`,
            link: routes["mypage.course.applications.index"],
            roles: ['teacher'],
            active: component.startsWith('Portal/MyPage/ClassApplication'),
            icon: <Article />,
        },
        {
            name: `${translatables.title.class.manage.view}`,
            link: routes["mypage.course.manage_class.index"],
            roles: ['teacher'],
            active: component.startsWith('Portal/MyPage/ManageClass'),
            icon: <MenuBook />,
        },
        {
            name: `${translatables.texts.badges}`,
            link: routes["mypage.badges.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/Badges'),
            icon: <Badge />,
        },
        {
            name: `${translatables.texts.teaching_history}`,
            link: routes["mypage.schedules"],
            roles: ['teacher'],
            active: component.startsWith('Portal/MyPage/TeachingHistory'),
            icon: <Teaching />,
        },
        {
            name: `${translatables.texts.class_history}`,
            link: routes["mypage.course.history.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/CourseHistory'),
            icon: <History />,
        },
        {
            name: `${translatables.texts.wallet_history}`,
            link: routes["mypage.wallet.history.index"],
            roles: ['student', 'teacher'],
            active: component.startsWith('Portal/MyPage/WalletHistory'),
            icon: <Wallet />,
        }
    ]

    const menu = navItems.map((item, index) => {
        let isAccessible = auth.user.roles.some(role => {
            return item.roles.includes(role.name);
        });

        if (isAccessible) {
            return (
                <ListItem key={index}>
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
                children={translatables.texts.sign_out}
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
                    <Typography variant="h5" py={3} children={translatables.texts.mypage} />
                </Toolbar>
                <Divider />
                {sidebarLink}
            </Drawer>
        </Box>
    )

    return (
        <Box>
            <Stack direction="row" alignItems="center" sx={{ display: { xs: 'flex', md: 'none' } }}>
                <IconButton onClick={toggleMobileDrawer}>
                    <Menu color="inherit" />
                </IconButton>
                <Typography
                    variant="h6"
                    children={myPageTitle}
                />
            </Stack>
            <Card sx={{ display: { xs: 'none', md: 'block' } }} children={sidebarLink} />
            {mobileDrawer}
        </Box>
    )
}

export default MyPage
