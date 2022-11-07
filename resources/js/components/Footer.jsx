import { Box, Toolbar, Typography } from "@mui/material";

const Footer = () => {
    return (
        <Box
            id="footer"
            sx={{
                bgcolor: 'text.primary',
                color: 'white'
            }}
        >
            <Toolbar variant="dense">
                <Typography
                    textAlign="center"
                    fontSize="12px"
                    width="100%"
                >&copy; Copyrights. All rights reserved</Typography>
            </Toolbar>
        </Box>
    )
}

export default Footer;
