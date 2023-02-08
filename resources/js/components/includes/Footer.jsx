import { Box, Container, Toolbar, Typography } from "@mui/material";

const Footer = () => {

    const year = (new Date()).getFullYear()

    return (
        <Box
            sx={{
                position: 'static',
                bottom: 0,
                left: 0,
                width: '100%',
                textAlign: "center",
                justifyContent: "center",
                backgroundColor: "primary.main",
                py: 2,
                mt: 5
            }}
            component="footer"
            id="appFooter"
        >
            <Container>
                <Typography
                    align="center"
                    variant="caption"
                    display="block"
                    width="100%"
                    color="white"
                >
                    <>&copy; All rights reserved {year}</>
                </Typography>
            </Container>
        </Box>
    )
}

export default Footer;
