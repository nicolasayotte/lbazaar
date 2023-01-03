import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Container, Divider, Grid, TextField, Typography } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import routes from "../../helpers/routes.helper"
import Input from "../../components/forms/Input"

const Inquiries = ({ messages }) => {

    const dispatch = useDispatch()

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
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

        post(routes["inquiries.store"], {
            onSuccess: () => {
                reset()
                clearErrors()

                dispatch(actions.success({
                    message: messages.success.inquiry
                }))
            },
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        });
    }

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h5">Inquiry</Typography>
                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Input
                                            label="Name"
                                            name="name"
                                            value={data.name}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} >
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label="Subject"
                                            name="subject"
                                            value={data.subject}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Input
                                            label="Message"
                                            multiline
                                            minRows={9}
                                            name="message"
                                            helperText="Must be less than 200 characters"
                                            value={data.message}
                                            onChange={handleOnChange}
                                            errors={errors}
                                        />
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
