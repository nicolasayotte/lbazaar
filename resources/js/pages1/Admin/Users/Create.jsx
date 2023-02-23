import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"
import UserForm from "./components/UserForm"

const Create = () => {

    const { roleOptions, countryOptions, classificationOptions, messages, errors } = usePage().props

    return (
        <Box>
            <Typography
                variant="h4"
                children="Create User"
                gutterBottom
            />
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs>
                    <Link href={routes["admin.users.index"]} children="Manage Users" />
                    <Typography color={'text.primary'} children="Create User" />
                </Breadcrumbs>
            </Box>
            <UserForm
                errors={errors}
                messages={messages}
                countryOptions={countryOptions}
                roleOptions={roleOptions}
                classificationOptions={classificationOptions}
            />
        </Box>
    )
}

export default Create
