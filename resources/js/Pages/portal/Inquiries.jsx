import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Divider, Grid, TextField, Typography } from "@mui/material"

const Inquiries = () => {

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        subject: '',
        message: ''
    })

    const handleOnChange = (e) => {
        setData(e.target.name, e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        post('/inquiries');
    }

    const errorMessage = (error) => (
        <Typography
            variant="p"
            color="error"
            sx={{
                fontSize: '13px'
            }}
        >{error}</Typography>
    )

    return (
        <Box my={5}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h5">Inquiry</Typography>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Name"
                                            fullWidth
                                            name="name"
                                            value={data.name}
                                            onChange={e => handleOnChange(e)}
                                        />
                                        { errors && errors.name && errorMessage(errors.name)}
                                    </Grid>
                                    <Grid item xs={12} sm={6} >
                                        <TextField
                                            label="Email Address"
                                            type="email"
                                            fullWidth
                                            name="email"
                                            value={data.email}
                                            onChange={e => handleOnChange(e)}
                                        />
                                        { errors && errors.email && errorMessage(errors.email)}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Subject"
                                            fullWidth
                                            name="subject"
                                            value={data.subject}
                                            onChange={e => handleOnChange(e)}
                                        />
                                        { errors && errors.subject && errorMessage(errors.subject)}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            label="Message"
                                            multiline
                                            fullWidth
                                            minRows={9}
                                            name="message"
                                            helperText="Must be less than 200 characters"
                                            value={data.message}
                                            onChange={e => handleOnChange(e)}
                                        />
                                        { errors && errors.message && errorMessage(errors.message)}
                                    </Grid>
                                    <Grid item xs={12} textAlign="right">
                                        <Button
                                            onClick={handleSubmit}
                                            variant="contained"
                                            disabled={processing}
                                        >Submit</Button>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default Inquiries
