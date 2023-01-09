import { createTheme } from "@mui/material";

const AdminTheme = createTheme({
    components: {
        MuiTableCell: {
            variants: [
                {
                    props: { variant: 'borderless' },
                    style: {
                        borderBottom: 'none'
                    }
                }
            ]
        }
    }
})

export default AdminTheme
