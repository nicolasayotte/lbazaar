import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Tabs, Tab, Card, CardContent, Grid, Box, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"
import { displaySelectOptions, handleOnChange, handleOnSelectChange } from "../../../../helpers/form.helper"
import ClassManageTable from "../components/ClassManageTable"
import routes, {getRoute} from "../../../../helpers/routes.helper"
import TableLoader from "../../../../components/common/TableLoader"
import { NoteAdd } from '@mui/icons-material';
import ManageClassTabs from "../components/ManageClassTabs"
import ClassInformationView from "../components/ClassInformationView"
import ClassInformationForm from "../components/ClassInformationForm"
import { useState } from "react"

const Details = () => {

    const { course, tabValue, categoryOptions, typeOptions, errors } = usePage().props

    const [isEditCourse, setIsEditCourse] = useState(false)

    const viewEditCourse = () => {
        setIsEditCourse(!isEditCourse)
    }

    const hideEditCourse = () => {
        setIsEditCourse(false)
    }

    const displayCourse = () => {
        return isEditCourse ?
            <ClassInformationForm
                routes={routes}
                course={course}
                categoryOptions={categoryOptions}
                typeOptions={typeOptions}
                cancelEdit={hideEditCourse}
                errors={errors.course}/>
            :
            <ClassInformationView course={course} viewEditCourse={viewEditCourse}/>
    }


    return (
        <>
            <Grid item md={12} lg={12} xs={12}>
                <ManageClassTabs tabValue={tabValue} id={course.id}/>
            </Grid>
            <Grid item md={12} xs={12}>
                {displayCourse()}
            </Grid>
        </>
    )
}

export default Details
