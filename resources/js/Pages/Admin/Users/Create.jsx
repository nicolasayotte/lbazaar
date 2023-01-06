import { Link } from "@inertiajs/inertia-react"
import { Box, Breadcrumbs, Typography } from "@mui/material"
import routes from "../../../helpers/routes.helper"

const Create = () => {
    return (
        <Box>
            <Typography
                variant="h4"
                children="Create User"
            />
            <Box sx={{ mb: 2 }}>
                <Breadcrumbs>
                    <Link href={routes["admin.users.index"]} children="Manage Users" />
                    <Typography color={'text.primary'} children="Create User" />
                </Breadcrumbs>
            </Box>
        </Box>
    )
}

export default Create
