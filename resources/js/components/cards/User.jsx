
import {Card, CardContent, Button, Typography, Box} from "@mui/material"
import { Link, usePage } from "@inertiajs/inertia-react"
import { getRoute } from "../../helpers/routes.helper"

const User = ({ user }) => {
    const { translatables } = usePage().props

    return (
        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" children={user.fullname} />
                        <Typography variant="caption" color="GrayText" children={`Member since ${user.created_at}`} />
                    </Box>
                    <Link href={getRoute('portal.users.view', {id : user.id})}>
                        <Button
                            size="small"
                            variant="contained"
                            children={translatables.texts.view_profile}
                        />
                    </Link>

                </Box>
            </CardContent>
        </Card>
    );
}

export default User
