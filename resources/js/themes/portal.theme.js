import { createTheme } from "@mui/material";
import { blue, grey, red, lightBlue, orange, green, purple,  } from "@mui/material/colors";

const PortalTheme = createTheme({
    components: {
        MuiTableCell: {
            variants: [
                {
                    props: { variant: 'colored' },
                    style: {
                        backgroundColor: blue['700'],
                        color: 'white'
                    }
                },
                {
                    props: { variant: 'colored', color: 'primary' },
                    style: {
                        backgroundColor: blue['700'],
                        color: 'white'
                    }
                },
                {
                    props: { variant: 'colored', color: 'error' },
                    style: {
                        backgroundColor: red['700'],
                        color: 'white'
                    }
                },
                {
                    props: { variant: 'colored', color: 'info' },
                    style: {
                        backgroundColor: lightBlue['700'],
                        color: 'white'
                    }
                },
                {
                    props: { variant: 'colored', color: 'warning' },
                    style: {
                        backgroundColor: orange['700']
                    }
                },
                {
                    props: { variant: 'colored', color: 'success' },
                    style: {
                        backgroundColor: green['800'],
                        color: 'white'
                    }
                },
                {
                    props: { variant: 'colored', color: 'secondary' },
                    style: {
                        backgroundColor: purple['500']
                    }
                }
            ]
        },
        MuiTableRow: {
            variants: [
                {
                    props: { variant: 'striped' },
                    style: {
                        '&:nth-of-type(even)': {
                            backgroundColor: grey['A100'],
                        },
                        // hide last border
                        '&:last-child td, &:last-child th': {
                            border: 0,
                        },
                    }
                }
            ]
        }
    }
})

export default PortalTheme
