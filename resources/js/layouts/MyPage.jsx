import { Container, Grid, Typography } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import MyPageSideBar from "../components/includes/MyPageSideBar"
import { Head, usePage } from "@inertiajs/inertia-react"

const Layout = ({ children }) => {

    const { title } = usePage().props

    const myPageTitle = title || 'My Page'

    return (
        <>
            <Head title={title} />
            <Navbar />
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography
                            variant="h5"
                            sx={{ mt: 3, display: { xs: 'none', md: 'inline-block' } }}
                            children={myPageTitle}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <MyPageSideBar />
                    </Grid>
                    <Grid item xs={12} md={9}>
                        { children }
                    </Grid>
                </Grid>
            </Container>
            <Toaster />
            <Footer />
        </>
    )
}

export default Layout;
