import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import { Head, usePage } from "@inertiajs/inertia-react"
import { ThemeProvider } from "@emotion/react";
import PortalTheme from "../themes/portal.theme";

const Layout = ({ children }) => {

    const { title } = usePage().props

    return (
        <>
            <Head title={title} />
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
