import { Container } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import MyPageSideBar from "../components/includes/MyPageSideBar"
import { Head, usePage } from "@inertiajs/inertia-react"

const Layout = ({ children }) => {

    const { title } = usePage().props

    return (
        <>
            <Head title={title} />
            <Navbar />
            <MyPageSideBar page={children} />
            <Toaster />
            <Footer />
        </>
    )
}

export default Layout;
