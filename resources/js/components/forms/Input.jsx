import { Box, TextField } from "@mui/material"
import ErrorText from "../common/ErrorText"

const Input = (props) => {
    return (
        <Box>
            <TextField
                size="small"
                fullWidth
                {...props}
                error={(props.errors && props.errors[props.name]) ? true : false}
            >
                { props.children }
            </TextField>
            {props.errors && props.errors[props.name] && <ErrorText error={props.errors[props.name]} />}
        </Box>
    )
}

export default Input
