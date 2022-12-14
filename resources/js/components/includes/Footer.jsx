import { Box, Container, Typography } from "@mui/material";


const Footer = () => {
    return (
        <Box
            sx={{
                textAlign: "center",
                justifyContent: "center",
                backgroundColor: "primary.main",
                py: 1,
                mt: 4
            }}
            component="footer"
        >
            <Container>
                <Typography color="white">
                    &copy; All rights reserved
                </Typography>
            </Container>
        </Box>
    )
}

export default Footer;
