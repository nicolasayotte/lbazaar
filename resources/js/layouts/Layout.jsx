import {Box, Container } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";

const Layout = ({ children }) => {

    return (
        <div>
            <Navbar />
            <Container maxWidth={false}>
                { children }
            </Container>
            <Footer />
        </div>
    )
}

export default Layout;
