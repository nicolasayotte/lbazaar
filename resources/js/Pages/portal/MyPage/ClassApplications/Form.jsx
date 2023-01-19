import { usePage } from "@inertiajs/inertia-react"
import { Box, Button, Card, CardContent, Grid, Pagination, Typography } from "@mui/material"
import ClassApplicationForm from "../components/ClassApplicationForm"
import routes from "../../../../helpers/routes.helper"


const Form = ({ auth, countries, errors, messages, categoryOptions, typeOptions, command = null }) => {
    return (
        <>
            <Box sx={{mt:6}}>
                <ClassApplicationForm
                    auth={auth}
                    countries={countries}
                    errors={errors}
                    messages={messages}
                    routes={routes}
                    categoryOptions={categoryOptions}
                    typeOptions={typeOptions}
                    command={command}
                />
            </Box>
        </>
    )
}

export default Form
