import { Box, Tabs, Tab } from "@mui/material"
import { getRoute } from "../../../../../helpers/routes.helper"
import { useState } from "react"
import { Inertia } from "@inertiajs/inertia"

const ManageClassTabs = ({ tabValue, id }) => {

    const [tab, setTab] = useState(tabValue);

    const handleChange = (e, newTab) => {
        setTab(newTab)

        Inertia.get(getRoute('mypage.course.manage_class.' + newTab, { id }))
    };

    return (
        <Box>
            <Tabs value={tab} onChange={handleChange}>
                <Tab label="Class Information" value="details"/>
                <Tab label="Student List" value="students"/>
                <Tab label="Feedbacks" value="feedbacks" />
                <Tab label="Quiz" value="quiz" />
            </Tabs>
        </Box>
    )
}

export default ManageClassTabs
