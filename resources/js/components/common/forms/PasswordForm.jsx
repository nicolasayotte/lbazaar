import { useForm } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../forms/Input"
import { actions } from "../../../store/slices/ToasterSlice"
import { handleOnChange } from "../../../helpers/form.helper"

const PasswordForm = ({ errors, messages: translatables, routes, logoutUrl }) => {

    const dispatch = useDispatch()

    const { data, setData, patch, processing, post } = useForm('PasswordForm', {
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    })

    const handleSubmit = e => {
        e.preventDefault()

        patch(routes['mypage.profile.password.update'], {
            errorBag: 'passwords',
            onSuccess: () => {
                dispatch(actions.success({
                    message: translatables.success.password
                }))
                setTimeout(() => {
                    dispatch(actions.hide())
                    post(routes[logoutUrl], {
                        onSuccess: () => dispatch(actions.success({
                            message: translatables.success.user.logout
                        }))
                    })
                }, 2000)
            },
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    return (
        <Card key="Password Form Card">
            <form onSubmit={handleSubmit}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography fontFamily="inherit" variant="h5" component="div" children={translatables.texts.update_password} />
                        <Typography variant="p" fontSize="small" color={"GrayText"} children={translatables.texts.update_password_notice} />
                    </Box>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label={translatables.texts.current_password}
                                name="current_password"
                                helperText={errors && errors.current_password ? '' : translatables.texts.update_password_help}
                                data={data.current_password}
                                errors={errors}
                                onChange={e => handleOnChange(e, setData)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label={translatables.texts.new_password}
                                name="new_password"
                                data={data.new_password}
                                errors={errors}
                                onChange={e => handleOnChange(e, setData)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                type="password"
                                label={translatables.texts.confirm_password}
                                name="new_password_confirmation"
                                data={data.new_password_confirmation}
                                errors={errors}
                                onChange={e => handleOnChange(e, setData)}
                            />
                        </Grid>
                        <Grid item xs={12} textAlign="right">
                            <Button
                                type="submit"
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={processing}
                                children={translatables.texts.update_password}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </form>
        </Card>
    )
}

export default PasswordForm
