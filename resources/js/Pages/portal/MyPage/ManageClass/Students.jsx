import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Tabs, Tab, Card, CardContent, Grid, Box, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import ClassManageTable from "../components/ClassManageTable"
import routes, {getRoute} from "../../../../helpers/routes.helper"
import TableLoader from "../../../../components/common/TableLoader"
import { NoteAdd } from '@mui/icons-material';
import ManageClassTabs from "../components/ManageClassTabs"

const Details = () => {

    const { course, tabValue } = usePage().props

    return (
        <>
            <Grid item md={12} lg={12} xs={12}>
                <ManageClassTabs tabValue={tabValue} id={course.id}/>
            </Grid>
            <Grid item md={12} xs={12}>
                <Card>
                    <CardContent>
                                Students
                    </CardContent>
                </Card>
            </Grid>
        </>
    )
}

export default Details
