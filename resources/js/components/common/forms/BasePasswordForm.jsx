import { useForm } from "@inertiajs/inertia-react"
import { Button, Grid } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../forms/Input"
import { actions } from "../../../store/slices/ToasterSlice"
import { handleOnChange } from "../../../helpers/form.helper"

const BasePasswordForm = ({ errors, messages: translatables, routes }) => {

    const dispatch = useDispatch()

    const { data, setData, patch, processing } = useForm('PasswordUpdateForm', {
        new_password: '',
        new_password_confirmation: ''
    })

    const handleSubmit = e => {
        e.preventDefault()

        patch(routes['mypage.profile.base.password.update'], {
            errorBag: 'passwords',
            onSuccess: () => {
                dispatch(actions.success({
                    message: translatables.success.password
                }))
            },
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    return (
        <Grid sx={{ mt: 2 }}>
            <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
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
            </form>
        </Grid>
    )
}

export default BasePasswordForm
