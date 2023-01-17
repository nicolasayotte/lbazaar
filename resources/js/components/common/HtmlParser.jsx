import { Typography } from "@mui/material";

const HtmlParser = ({ html }) => (
    <div dangerouslySetInnerHTML={{__html: html}} />
)

export default HtmlParser
