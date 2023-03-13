import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Autocomplete, Breadcrumbs, Button, Grid, Paper, TextField, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import TextEditorInput from "../../../../components/forms/TextEditorInput"
import { displaySelectOptions, handleEditorOnChange, handleOnChange } from "../../../../helpers/form.helper"
import routes from "../../../../helpers/routes.helper"

const Create = () => {

    const { translatables, categoryOptions } = usePage().props

    const typeOptions = [
        { name: 'General', value: 'general' },
        { name: 'Free', value: 'free' },
        { name: 'Earn', value: 'earn' },
        { name: 'Special', value: 'special' },
    ]

    const formatOptions = [
        { name: 'Live', value: 'live' },
        { name: 'On-Demand', value: 'on-demand' }
    ]

    const frequencyOptions = [
        { name: 'Daily', value: 'daily' },
        { name: 'Weekly', value: 'weekly' },
        { name: 'Others', value: 'others' }
    ]

    const { data, setData, post, errors } = useForm('Create Class Application', {
        title: '',
        type: 'general',
        format: 'live',
        category: '',
        lecture_frequency: 'daily',
        length: '',
        price: 0,
        points_earned: 0,
        seats: 0,
        description: ''
    })

    const handleOnSubmit = e => {
        e.preventDefault()

        post(routes["mypage.course.applications.store"])
    }

    return (
        <form onSubmit={handleOnSubmit}>
            <Grid container spacing={2} alignItems="center" justifyContent="space-between">
                <Grid item xs={12} md="auto">
                    <Typography variant="h5" children={translatables.title.class.applications.create} />
                    <Breadcrumbs>
                        <Link href={routes["mypage.course.applications.index"]} children={translatables.title.class.applications.index} />
                        <Typography color="text.primary" children={translatables.title.class.applications.create} />
                    </Breadcrumbs>
                </Grid>
                <Grid item xs={12} md={3} container spacing={1}>
                    <Grid item xs={12} md={6}>
                        <Link href={routes["mypage.course.applications.index"]}>
                            <Button
                                children={translatables.texts.cancel}
                                fullWidth
                            />
                        </Link>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Button
                            type="submit"
                            variant="contained"
                            children={translatables.texts.submit}
                            fullWidth
                            onClick={handleOnSubmit}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Input
                                    label={translatables.texts.title}
                                    name="title"
                                    value={data.title}
                                    onChange={e => handleOnChange(e, setData)}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Input
                                    select
                                    label={translatables.texts.type}
                                    name="type"
                                    value={data.type}
                                    onChange={e => handleOnChange(e, setData)}
                                    InputLabelProps={{ shrink: true }}
                                    children={displaySelectOptions(typeOptions, 'value')}
                                    errors={errors}
                                />
                            </Grid>
                            {
                                data.type === 'free' &&
                                <Grid item xs={12} md={4}>
                                    <Input
                                        label={translatables.texts.price}
                                        value="Free"
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ readOnly: true }}
                                    />
                                </Grid>
                            }
                            {
                                (data.type === 'general' || data.type === 'special') &&
                                <Grid item xs={12} md={4}>
                                    <Input
                                        label={translatables.texts.price}
                                        name="price"
                                        value={data.price}
                                        onChange={e => handleOnChange(e, setData)}
                                        errors={errors}
                                    />
                                </Grid>
                            }
                            {
                                data.type === 'earn' &&
                                <Grid item xs={12} md={4}>
                                    <Input
                                        label={translatables.texts.points_earned}
                                        name="points_earned"
                                        value={data.points_earned}
                                        onChange={e => handleOnChange(e, setData)}
                                        errors={errors}
                                    />
                                </Grid>
                            }
                            <Grid item xs={12}>
                                <Autocomplete
                                    freeSolo
                                    options={categoryOptions.map(category => category.name)}
                                    fullWidth
                                    size="small"
                                    onChange={(e, newValue) => setData('category', newValue)}
                                    renderInput={params =>
                                        <Input
                                            {...params}
                                            label={translatables.texts.category}
                                            name="category"
                                            value={data.category}
                                            onChange={e => handleOnChange(e, setData)}
                                            errors={errors}
                                        />
                                    }
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    select
                                    label={translatables.texts.format}
                                    name="format"
                                    value={data.format}
                                    onChange={e => handleOnChange(e, setData)}
                                    InputLabelProps={{ shrink: true }}
                                    children={displaySelectOptions(formatOptions, 'value')}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    type="number"
                                    label={translatables.texts.seats}
                                    name="seats"
                                    value={data.seats}
                                    onChange={e => handleOnChange(e, setData)}
                                    inputProps={{ min: 1 }}
                                    InputLabelProps={{ shrink: true }}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label={translatables.texts.length}
                                    name="length"
                                    value={data.length}
                                    onChange={e => handleOnChange(e, setData)}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    select
                                    label={translatables.texts.frequency}
                                    name="lecture_frequency"
                                    value={data.lecture_frequency}
                                    onChange={e => handleOnChange(e, setData)}
                                    InputLabelProps={{ shrink: true }}
                                    children={displaySelectOptions(frequencyOptions, 'value')}
                                    errors={errors}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Input
                                    label={translatables.texts.description}
                                    multiline
                                    name="description"
                                    value={data.description}
                                    rows={10}
                                    onChange={e => handleOnChange(e, setData)}
                                    errors={errors}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </form>
    )
}

export default Create
