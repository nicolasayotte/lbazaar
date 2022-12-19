import { Box, TextField } from "@mui/material"
import ErrorText from "../common/ErrorText"

const Input = (props) => {
    return (
        <Box>
            <TextField
                {...props}
            >
                { props.children }
            </TextField>
            {props.errors && props.errors[props.name] && <ErrorText error={props.errors[props.name]} />}
        </Box>
    )
}

export default Input
