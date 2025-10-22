import { useForm } from "@inertiajs/inertia-react"
import { Button, Card, CardContent, Grid, Typography } from "@mui/material"
import { useDispatch } from "react-redux"
import Input from "../../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange } from "../../../../../helpers/form.helper"
import { actions } from "../../../../../store/slices/ToasterSlice"
import { usePage } from '@inertiajs/inertia-react'
import FileInput from "../../../../../components/forms/CustomFileInput"
import { useState } from "react"

const ProfileForm = ({ errors, auth, countries, messages, routes }) => {

    const dispatch = useDispatch()
    const { translatables } = usePage().props

    const { data, setData, post, processing } = useForm('ProfileForm', {
        first_name: auth.user.first_name,
        last_name: auth.user.last_name,
        image: auth.user.image,
        email: auth.user.email,
        country_id: auth.user.country_id
    })
    const [imgPreview, setImgPreview] = useState(data && data.image ? data.image : null)

    const handleSubmit = e => {
        e.preventDefault()

        post(routes["mypage.profile.update"], {
            preserveScroll: true,
            errorBag: 'profile',
            onSuccess: () => dispatch(actions.success({
                message: messages.success.profile
            })),
            onError: () => dispatch(actions.error({
                message: messages.error
            }))
        })
    }

    const handleOnFileUpload = (e, setPreviewMethod) => {
        const uploadedFile = e.target.files[0]

        if (uploadedFile) {
            setPreviewMethod(URL.createObjectURL(uploadedFile))
            setData(data => ({
                ...data,
                [e.target.name]: uploadedFile
            }))
        }
    }

    return (
        <Card key="Profile Form Card">
            <form onSubmit={handleSubmit}>
                <CardContent sx={{ p: 4 }}>
                    <Typography fontFamily="inherit" variant="h5" component="div" sx={{ mb: 4 }}>{translatables.texts.edit_profile}</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={12}>
                            <FileInput
                                name="image"
                                value={data.image}
                                helperText={`${translatables.texts.recommended_size}: 200x200`}
                                onChange={e => handleOnFileUpload(e, setImgPreview)}
                                src={imgPreview}
                                errors={errors}
                                isAvatar={true}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label={translatables.texts.first_name}
                                name="first_name"
                                value={data.first_name}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label={translatables.texts.last_name}
                                name="last_name"
                                value={data.last_name}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                label={translatables.texts.email}
                                disabled
                                name="email"
                                value={data.email}
                                onChange={e => handleOnChange(e, setData)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                label={translatables.texts.country}
                                select
                                name="country_id"
                                value={data.country_id}
                                onChange={e => handleOnChange(e, setData)}
                                errors={errors}
                            >
                                {displaySelectOptions(countries)}
                            </Input>
                        </Grid>
                        <Grid item xs={12} textAlign="right">
                            <Button
                                type="submit"
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={processing}
                            >{translatables.texts.update_profile}</Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </form>
        </Card>
    )
}

export default ProfileForm
