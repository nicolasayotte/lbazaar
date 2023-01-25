import { Link } from "@inertiajs/inertia-react"
import { Box, Tabs, Tab } from "@mui/material"
import { getRoute } from "../../../../helpers/routes.helper"
import { useState } from "react"
import { useForm } from "@inertiajs/inertia-react"

const ManageClassTabs = ({ tabValue, id }) => {

    const [value, setValue] = useState(tabValue);

    const { get } = useForm()

    const handleChange = (e, newValue) => {
        get(getRoute('mypage.course.manage_class.' + newValue, { id: id}))
    };

    return (
        <Box>
            <Link href="" id="link"></Link>
            <Tabs value={value} onChange={handleChange}>
                <Tab label="Class Information" value="details"/>
                <Tab label="Student Lists" value="students"/>
                <Tab label="Feedbacks" value="feedbacks" />
            </Tabs>
        </Box>
    )
}

export default ManageClassTabs
