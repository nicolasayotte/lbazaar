
import routes from "../../../helpers/routes.helper"
import { Typography, Box, Grid, Card, CardContent, List, Divider, IconButton, Drawer, Toolbar, ListItem, ListItemButton} from "@mui/material"
import { useState } from "react"
import { Menu } from "@mui/icons-material"
import { Link } from "@inertiajs/inertia-react"
import ProfileForm from "./components/ProfileForm"

const Index = ({ auth, countries, errors, messages, window }) => {

    const container = window !== undefined ? () => window().document.body : undefined;

    const [openMobileDrawer, setopenMobileDrawer] = useState(false)

    const drawerWidth = 240

    const toggleMobileDrawer = () => {
        setopenMobileDrawer(!openMobileDrawer)
    }

    const navItems = [
        {
            name: 'Profile',
            link: ''
        },
        {
            name: 'Class Histories',
            link: ''
        }
    ]

    const menu = (
        <>
            {navItems.map(item => (
                <ListItem key={item.name}>
                    <ListItemButton>
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
            ))}
        </>
    )

    const logoutBtn = (
        <ListItemButton>
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
            <Toolbar>
                <Typography variant="h6" textAlign="center">My Page</Typography>
            </Toolbar>
            <Divider />
            <List>
                {menu}
                <Divider />
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
        <Box>
            <Grid container sx={{m: 4}}>
                <Grid item xs={10} sm={3} md={3} lg={3}>
                    <Card sx={{ display: { xs: 'none', sm: 'none', md: 'inline-block' } }}>
                        <CardContent sx={{ p: '30px'}}>
                            {sidebarLink}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={10} sm={9} md={9} lg={9}>
                    <Grid container>  
                        <IconButton
                                color="white"
                                sx={{ display: { xs: 'inline-block', sm: 'inline-block', md: 'none' } }}
                                onClick={toggleMobileDrawer}
                            >
                                <Menu color="inherit" />
                            </IconButton>
                            <Typography
                                variant="h4"
                                children="Profile"
                                gutterBottom
                            />
                    </Grid>
                    <ProfileForm
                        auth={auth}
                        countries={countries}
                        errors={errors.profile}
                        messages={messages}
                        routes={routes}
                    />
                </Grid>
            </Grid>
            {mobileDrawer}
        </Box>
    )
}

export default Index
