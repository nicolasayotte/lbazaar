import { Box, Container } from "@mui/material";

const Layout = ({ children }) => {

    return (
        <>
            <Box>
                <Container>
                    { children }
                </Container>
            </Box>
        </>
    )
}

export default Layout;
