import { Box, Typography } from "@mui/material"
import ErrorText from "../common/ErrorText"
import ReactQuill from 'react-quill';
import modules from "../../helpers/editormodules.helper"
import 'react-quill/dist/quill.snow.css';

const TextEditorInput = (props) => {

    if (props.modules != undefined) {
        modules.toolbar.push(...props.modules)
    }

    return (
        <Box>
            <ReactQuill
                theme="snow"
                {...props}
                modules={modules}
                className={props.errors && props.errors[props.name] ? "ql-error" : null}
            />
            <Typography variant="subtitle1">
                {props.errors && props.errors[props.name] && <ErrorText error={props.errors[props.name]} />}
            </Typography>
        </Box>
    )
}

export default TextEditorInput
