import { Container } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import MyPageSideBar from "../components/includes/MyPageSideBar"

const Layout = ({ children }) => {

    return (
        <>
            <Navbar />
            <Container>
                <MyPageSideBar page={children} />
            </Container>
            <Toaster />
            <Footer />
        </>
    )
}

export default Layout;
