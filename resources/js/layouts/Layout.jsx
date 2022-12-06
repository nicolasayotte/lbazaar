import { Container } from "@mui/material";
import Navbar from "../components/includes/Navbar";

const Layout = ({ children }) => {

    return (
        <>
            <Navbar />
            <Container>
                { children }
            </Container>
        </>
    )
}

export default Layout;
