import { Box, TextField } from "@mui/material"
import ErrorText from "../common/ErrorText"

const Input = (props) => {
    return (
        <Box>
            <TextField
                size="small"
                fullWidth
                error={(props.errors && props.errors[props.custom_name || props.name]) ? true : false}
                FormHelperTextProps={{
                    variant: 'standard'
                }}
                SelectProps={{
                    native: true
                }}
                {...props}
            >
                { props.children }
            </TextField>
            {props.errors && props.errors[props.custom_name || props.name] && <ErrorText error={props.errors[props.custom_name || props.name]} />}
        </Box>
    )
}

export default Input
