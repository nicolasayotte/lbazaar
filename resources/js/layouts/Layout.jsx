import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import { ThemeProvider } from "@emotion/react";
import PortalTheme from "../themes/portal.theme";
import Meta from "../components/common/Meta";

const Layout = ({ children }) => {

    return (
        <>
            <Meta />
            <ThemeProvider theme={PortalTheme}>
                <Navbar />
                <>{ children }</>
                <Toaster />
                <Footer />
            </ThemeProvider>
        </>
    )
}

export default Layout;
