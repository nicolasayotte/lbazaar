import { Box, Container } from "@mui/material";
import { useState } from "react";
import { useEffect } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const Layout = ({ children }) => {

    const [containerHeight, setContainerHeight] = useState(0);

    useEffect(() => {
        let screenHeight = window.innerHeight

        var navbarHeight = document.getElementById('navbar').clientHeight
        var footerHeight = document.getElementById('footer').clientHeight

        setContainerHeight(screenHeight - (navbarHeight + footerHeight))

        console.log(screenHeight, navbarHeight, footerHeight, containerHeight);
    }, [])

    return (
        <>
            <Navbar />
            <Box sx={{ minHeight: containerHeight + 'px' }}>
                <Container>
                    { children }
                </Container>
            </Box>
            <Footer />
        </>
    )
}

export default Layout;
