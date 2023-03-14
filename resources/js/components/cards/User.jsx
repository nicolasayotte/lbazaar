
import {Card, CardContent, Button, Typography, Box , Avatar, Grid } from "@mui/material"
import { Link, usePage } from "@inertiajs/inertia-react"
import { getRoute } from "../../helpers/routes.helper"
import placeholderImg from "../../../img/placeholder.png"

const User = ({ user, showInfo = false }) => {
    const { translatables } = usePage().props

    return (
        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box  mr={2}>
                        <Avatar
                            src={user.image || placeholderImg}
                            variant="circular"
                            sx={{
                                width: 100,
                                height: 100,
                                maxWidth: '100%',
                                mx: 'auto'
                            }}
                        />
                    </Box>
                    <Box>
                        <Typography variant="h6" children={user.fullname} />
                        <Typography variant="caption" color="GrayText" children={`Member since ${user.created_at}`} />
                        <Link href={getRoute('portal.users.view', {id : user.id})}>
                            <Button
                                size="small"
                                variant="contained"
                                children={translatables.texts.view_profile}
                            />
                        </Link>
                    </Box>


                </Box>
            </CardContent>
        </Card>
    );
}

export default User
