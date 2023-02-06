import { Upload } from "@mui/icons-material"
import { Box, Button, Grid } from "@mui/material"
import ErrorText from "../common/ErrorText"
import Input from "./Input"

const FileInput = ({ name, value = '', handleOnChange = () => {}, errors, buttonPosition = 'start', accepts = "image" }) => {

    const buttonStyles = buttonPosition === 'start'
    ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
    : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }

    const inputStyles = buttonPosition === 'start'
    ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 0 }
    : { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }

    const showInputDialog = () => {
        document.getElementById(`file-input-button-${name}`).click()
    }

    return (
        <Box>
            <Grid container flexDirection={(buttonPosition === 'start') ? 'row' : 'row-reverse'}>
                <Grid item xs={6} md={3}>
                    <Button
                        component="label"
                        startIcon={<Upload />}
                        fullWidth
                        variant="contained"
                        disableElevation
                        sx={{
                            ...buttonStyles,
                            height: '100%'
                        }}
                        id={`file-input-button-${name}`}
                    >
                        Upload
                        <Input
                            name={name}
                            type="file"
                            label="Class Image"
                            value={value}
                            InputProps={{
                                accepts: `${accepts}/*`
                            }}
                            sx={{
                                display: 'none'
                            }}
                            onChange={handleOnChange}
                        />
                    </Button>
                </Grid>
                <Grid item xs={6} md={9}>
                    <Input
                        placeholder="No file selected"
                        InputProps={{
                            readOnly: true,
                            sx: inputStyles
                        }}
                        onClick={showInputDialog}
                    />
                </Grid>
            </Grid>
            { errors && errors[name] && <ErrorText error={errors[name]} /> }
        </Box>
    )
}

export default FileInput
