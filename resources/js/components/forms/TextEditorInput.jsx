import { Box, Typography } from "@mui/material"
import ErrorText from "../common/ErrorText"
import ReactQuill from 'react-quill';

const TextEditorInput = (props) => {

    const modules = {
        toolbar:  [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}],

        ]
    }

    if (props.modules != undefined) {
        modules.toolbar.push(...props.modules)
        console.log( modules.toolbar)
    }

    return (
        <Box>
            <ReactQuill
                    {...props}
                    modules={modules}
                    className={props.errors && props.errors[props.name] ? "ql-error" : null}
                    />
                <Typography variant="subtitle1" sx={{mt:5}}>
                    {props.errors && props.errors[props.name] && <ErrorText error={props.errors[props.name]} />}
                </Typography>

        </Box>
    )
}

export default TextEditorInput
