import { usePage } from "@inertiajs/inertia-react"
import { Grid } from "@mui/material"
import routes from "../../../../helpers/routes.helper"
import ManageClassTabs from "./components/ManageClassTabs"
import ClassInformationView from "./components/ClassInformationView"
import ClassInformationForm from "./components/ClassInformationForm"
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
