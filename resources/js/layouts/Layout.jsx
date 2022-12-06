import { Container } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";

const Layout = ({ children }) => {

    return (
        <>
            <Navbar />
            <Container>
                { children }
            </Container>
            <Footer />
        </>
    )
}

export default Layout;
