import { Container } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";

const Layout = ({ children }) => {

    return (
        <>
            <Navbar />
            <Container>
                { children }
            </Container>
            <Toaster />
            <Footer />
        </>
    )
}

export default Layout;
