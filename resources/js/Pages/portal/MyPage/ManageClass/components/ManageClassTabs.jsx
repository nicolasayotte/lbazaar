import { Box, Tabs, Tab, Paper } from "@mui/material"
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
        <Paper sx={{ mb: 2 }}>
            <Tabs
                variant="scrollable"
                value={tab}
                onChange={handleChange}
                scrollButtons="auto"
                allowScrollButtonsMobile
            >
                <Tab label="Class Information" value="details"/>
                <Tab label="Student List" value="students"/>
                <Tab label="Feedbacks" value="feedbacks" />
                <Tab label="Exams" value="exams" />
            </Tabs>
        </Paper>
    )
}

export default ManageClassTabs
