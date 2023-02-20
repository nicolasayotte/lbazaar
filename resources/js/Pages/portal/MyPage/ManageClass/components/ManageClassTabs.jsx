import { Tabs, Tab, Divider } from "@mui/material"
import { getRoute } from "../../../../../helpers/routes.helper"
import { useState } from "react"
import { Inertia } from "@inertiajs/inertia"
import { usePage } from "@inertiajs/inertia-react"

const ManageClassTabs = ({ tabValue = 'schedules', id }) => {

    const { translatables } = usePage().props

    const [tab, setTab] = useState(tabValue);

    const handleChange = (e, newTab) => {
        setTab(newTab)

        Inertia.get(getRoute('mypage.course.manage_class.' + newTab, { id }))
    };

    return (
        <>
            <Tabs
                variant="scrollable"
                value={tab}
                onChange={handleChange}
                scrollButtons="auto"
                allowScrollButtonsMobile
            >
                <Tab label={translatables.title.schedules} value="schedules"/>
                <Tab label={translatables.title.exams} value="exams" />
                <Tab label={translatables.title.feedbacks} value="feedbacks" />
            </Tabs>
            <Divider sx={{ mb: 2 }} />
        </>
    )
}

export default ManageClassTabs
