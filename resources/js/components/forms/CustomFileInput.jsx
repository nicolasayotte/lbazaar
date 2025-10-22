import { Upload } from "@mui/icons-material"
import { Box, Button, CardMedia, FormHelperText, Grid, Avatar } from "@mui/material"
import ErrorText from "../common/ErrorText"
import Input from "./Input"
import placeholderImg from "../../../img/placeholder.png"
import { usePage } from "@inertiajs/inertia-react"

const CustomFileInput = ({ name, src = '', value, onChange = () => {}, errors, helperText = '', buttonPosition = 'start', accepts = "image", placeholderImageHeight = '200px', isAvatar = false }) => {

    const { translatables } = usePage().props

    const buttonStyles = buttonPosition === 'start'
    ? { borderTopRightRadius: 0, borderBottomRightRadius: 0 }
    : { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }

    const inputStyles = buttonPosition === 'start'
    ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 0 }
    : { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }

    const showInputDialog = () => {
        document.getElementById(`file-input-button-${name}`).click()
    }

    const acceptTypes = {
        image: 'image/*',
        video: "video/*"
    }

    const PreviewComponent = () => {

        if (accepts === 'image' || (accepts === 'video' && src == null)) {
            return (
                <Box mb={2} onClick={showInputDialog}>

                    { isAvatar ? (
                        <Avatar
                            src={src || placeholderImg}
                            variant="circular"
                            sx={{
                                width: 200,
                                height: 200,
                                maxWidth: '100%',
                                mx: 'auto'
                            }}
                        />
                    ) : (
                        <CardMedia
                            image={src || placeholderImg}
                            sx={{
                                minHeight: placeholderImageHeight,
                                backgroundSize: 'cover',
                                cursor: 'pointer',
                            }}
                        />
                    )}

                    { helperText && <FormHelperText children={helperText} /> }
                </Box>
            )
        }

        if (accepts === 'video') {
            return (
                <Box mb={2} onClick={showInputDialog}>
                    <video
                        src={src}
                        controls
                        style={{
                            minHeight: placeholderImageHeight,
                            width: '100%'
                        }}
                    />
                    { helperText && <FormHelperText children={helperText} /> }
                </Box>
            )
        }
    }

    return (
        <>
            <PreviewComponent />
            <Box>
                <Grid container flexDirection={(buttonPosition === 'start') ? 'row' : 'row-reverse'}>
                    <Grid item xs={4} md={4}>
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
                                inputProps={{
                                    accepts: acceptTypes[accepts],
                                    accept: acceptTypes[accepts]
                                }}
                                sx={{
                                    display: 'none'
                                }}
                                onChange={onChange}
                            />
                        </Button>
                    </Grid>
                    <Grid item xs={8} md={8}>
                        <Input
                            placeholder={translatables.texts.no_file_selected}
                            InputProps={{
                                readOnly: true,
                                sx: inputStyles
                            }}
                            value={value && value.name || ''}
                            onClick={showInputDialog}
                        />
                    </Grid>
                </Grid>
                { (accepts !== 'image' && accepts !== 'video') && helperText && <FormHelperText children={helperText} /> }
                { errors && errors[name] && <ErrorText error={errors[name]} /> }
            </Box>
        </>
    )
}

export default CustomFileInput
