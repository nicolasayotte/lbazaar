import { Box } from "@mui/material"

const Header = ({ minHeight = '200px', children }) => {
    return (
        <Box
            sx={{
                minHeight: minHeight,
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#888',
                color: 'white',
                backgroundImage: "url(https://fastly.picsum.photos/id/4/5000/3333.jpg?hmac=ghf06FdmgiD0-G4c9DdNM8RnBIN7BO0-ZGEw47khHP4)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: 'relative',
                mb: 2
            }}
        >
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#333",
                    opacity: 0.5
                }}
            />
            <Box sx={{ position: 'relative', zIndex: 500 }}>
                {children}
            </Box>
        </Box>
    )
}

export default Header
