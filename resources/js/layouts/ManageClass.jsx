import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import { Head, usePage } from "@inertiajs/inertia-react"
import ClassInformationHeader from "../pages/Portal/MyPage/ManageClass/components/ClassInformationHeader";
import { Container } from "@mui/material";
import ManageClassTabs from "../pages/Portal/MyPage/ManageClass/components/ManageClassTabs";

const Layout = ({ children }) => {

    const { title, tabValue, course } = usePage().props

    return (
        <>
            <Head title={title} />
            <Navbar />
            <ClassInformationHeader />
            <Container>
                <ManageClassTabs id={course.id} tabValue={tabValue || 'schedules'} />
                {children}
            </Container>
            <Toaster />
            <Footer />
        </>
    )
}

export default Layout;
