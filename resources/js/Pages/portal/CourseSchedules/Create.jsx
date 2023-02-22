import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Breadcrumbs, Button, Container, Grid, InputBase, Paper, Typography } from "@mui/material"
import ErrorText from "../../../components/common/ErrorText"
import { handleOnChange } from "../../../helpers/form.helper"
import routes, { getRoute } from "../../../helpers/routes.helper"

const Create = () => {

    const { translatables, course, current_date } = usePage().props

    const minDate = current_date.slice(0, 16)

    const { data, setData, post, errors } = useForm({
        start_datetime: minDate,
        max_participant: course.max_participant
    })

    const handleOnSubmit = e => {
        e.preventDefault()

        post(getRoute('schedules.store', { id: course.id }))
    }

    return (
        <form onSubmit={handleOnSubmit}>
            <Container sx={{ py: 5, minHeight: '100vh' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={9}>
                        <Typography variant="h5" children={translatables.title.schedules.create} />
                        <Breadcrumbs>
                            <Link href={routes["mypage.course.manage_class.index"]} children={translatables.title.class.manage.index} />
                            <Link
                                href={getRoute('mypage.course.manage_class.schedules', { id: course.id })}
                                children={`${translatables.title.class.manage.view} - ${translatables.title.schedules.index}`}
                            />
                            <Typography color="text.primary" children={translatables.title.schedules.create} />
                        </Breadcrumbs>
                    </Grid>
                    <Grid item container xs={12} md={3} alignItems="center" spacing={2}>
                        <Grid item xs={12} md={6} order={{ xs: 1, md: 0 }}>
                            <Link href={getRoute('mypage.course.manage_class.schedules', { id: course.id })}>
                                <Button
                                    variant="outlined"
                                    children={translatables.texts.cancel}
                                    fullWidth
                                />
                            </Link>
                        </Grid>
                        <Grid item xs={12} md={6} order={{ xs: 0, md: 1 }}>
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
                            <InputBase
                                type="datetime-local"
                                fullWidth
                                inputProps={{
                                    min: minDate
                                }}
                                name="start_datetime"
                                value={data.start_datetime}
                                onChange={e => handleOnChange(e, setData)}
                                error={errors && errors.start_datetime != undefined}
                            />
                        </Paper>
                        { errors && errors.start_datetime && <ErrorText error={errors.start_datetime} /> }
                    </Grid>
                </Grid>
            </Container>
        </form>
    )
}

export default Create
