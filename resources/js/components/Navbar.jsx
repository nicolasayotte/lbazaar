import { Menu, Translate } from "@mui/icons-material";
import { AppBar, Box, Button, Link, Toolbar, Typography } from "@mui/material";

const Navbar = () => {
    return (
        <AppBar position="static" id="navbar" sx={{ bgcolor: 'text.primary' }}>
            <Toolbar sx={{ minHeight: '35px !important', bgcolor: 'text.secondary' }}>
                <Box
                    ml="auto"
                    fontSize="12px"
                    display="flex"
                    alignItems="center"
                >
                    <Translate fontSize="small"/>
                    <Link mx={1} color="inherit">(JP) Japanese</Link>
                    <Link color="inherit">(EN) English</Link>
                </Box>
            </Toolbar>
            <Toolbar>
                <Menu
                    sx={{
                        display: { xs: 'flex', md: 'none' }
                    }}
                />
                <Typography
                    variant="h6"
                    color="inherit"
                    component="div"
                >
                    L-Earning Bazaar
                </Typography>
                <Box
                    ml="auto"
                    sx={{
                        display: { xs: 'none', md: 'flex' }
                    }}
                >
                    <Button color="inherit">Inquiry</Button>
                    <Button color="inherit" sx={{ mx: 1 }}>Sign In</Button>
                    <Button color="inherit">Sign Up</Button>
                </Box>
            </Toolbar>
        </AppBar>
    )
}

export default Navbar;
