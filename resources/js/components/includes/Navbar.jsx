import { AppBar, Container, Typography } from "@mui/material"

const Navbar = () => {
    return (
        <AppBar position="static" color="primary">
            <Container>
                <Typography variant="h6" sx={{ my: 3 }}>L-Earning Bazaar</Typography>
            </Container>
        </AppBar>
    )
}

export default Navbar
