import { Box, TextField } from "@mui/material"
import ErrorText from "../common/ErrorText"
import { MuiFileInput } from 'mui-file-input'

const FileInput = (props) => {
    return (
        <Box>
            <MuiFileInput
                {...props}
                hideSizeText={true}
                variant="outlined"
                size="small"
            />
            <br />
            {props.errors && props.errors[props.name] && <ErrorText error={props.errors[props.name]} />}
        </Box>
    )
}

export default FileInput
