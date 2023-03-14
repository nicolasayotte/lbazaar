import { Container, Grid, Typography } from "@mui/material";
import Footer from "../components/includes/Footer";
import Navbar from "../components/includes/Navbar";
import Toaster from "../components/includes/Toaster";
import MyPageSideBar from "../components/includes/MyPageSideBar"
import { Head, usePage } from "@inertiajs/inertia-react"

const Layout = ({ children }) => {

    const { title, hasButtons } = usePage().props

    const myPageTitle = title || 'My Page'

    return (
        <>
            <Head title={title} />
            <Navbar />
            <Container sx={{ py: 4 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <MyPageSideBar />
                    </Grid>
                    <Grid item xs={12} md={9}>
                        {
                            !hasButtons &&
                            <Typography
                                variant="h5"
                                sx={{ display: { xs: 'none', md: 'inline-block' } }}
                                gutterBottom
                                children={myPageTitle}
                            />
                        }
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
