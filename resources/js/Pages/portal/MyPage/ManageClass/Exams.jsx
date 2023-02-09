import { Link, usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Divider, Grid } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions } from "../../../../helpers/form.helper"
import { getRoute } from "../../../../helpers/routes.helper"
import ManageClassTabs from "./components/ManageClassTabs"

const Exams = () => {

    const { tabValue, courseId, translatables } = usePage().props

    const statusOptions = [
        { name: translatables.texts.all, value: '' },
        { name: translatables.filters.status.active, value: 'active' },
        { name: translatables.filters.status.disabled, value: 'disabled' }
    ]

    const sortOptions = [
        { name: translatables.filters.name.asc, value: 'name:asc' },
        { name: translatables.filters.name.desc, value: 'name:desc' },
        { name: translatables.filters.date.asc, value: 'created_at:asc' },
        { name: translatables.filters.date.desc, value: 'created_at:desc' }
    ]

    return (
        <>
            <Grid item xs={12}>
                <ManageClassTabs tabValue={tabValue} id={courseId} />
            </Grid>
            <Grid item xs={12}>

                <Card>
                    <CardContent>
                        <form>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={3}>
                                    <Input
                                        label={translatables.texts.keyword}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Input
                                        label={translatables.texts.status}
                                        select
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                        children={displaySelectOptions(statusOptions, 'value')}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Input
                                        label={translatables.texts.sort}
                                        select
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                        children={displaySelectOptions(sortOptions, 'value')}
                                    />
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        children={translatables.texts.filter}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Link href={getRoute('exams.create', { id: courseId })}>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            children={translatables.texts.create_exam}
                                            fullWidth
                                        />
                                    </Link>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Grid>
        </>
    )
}

export default Exams
