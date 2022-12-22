import { Divider } from "@mui/material";

const DividerSection = ({ fontSize = '15pt', title }) => (
    <Divider sx={{ my: 2, fontSize: fontSize }}>{title}</Divider>
)

export default DividerSection
