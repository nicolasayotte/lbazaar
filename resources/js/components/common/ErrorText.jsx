import { Typography } from "@mui/material";

const ErrorText = ({ error }) => (
    <Typography
        variant="p"
        color="error"
        sx={{
            fontSize: '13px'
        }}
    >{error}</Typography>
)

export default ErrorText
