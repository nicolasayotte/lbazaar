
import {Card, CardContent, Button, Typography, Box , Avatar, Grid, Tooltip } from "@mui/material"
import { Link, usePage } from "@inertiajs/inertia-react"
import { getRoute } from "../../helpers/routes.helper"
import placeholderImg from "../../../img/placeholder.png"
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { Email } from "@mui/icons-material"

const TeacherInfo = ({ user }) => {
    const { translatables } = usePage().props

    const name = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={`${user.first_name} ${user.last_name}`}
            style={{ flex: 1 }}
        />
    )

    const email = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.email}
            ml={1}
        />
    )

    const joined_date = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={`Member since ${user.created_at}`}
            ml={1}
        />
    )

    const specialization_data = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.specialty}
        />
    )
    return (

        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                <Grid container>
                    <Grid item xs={12} md={12} mx="auto">
                        <Grid container>
                            <Grid item textAlign="center" xs={12} md={3}>
                                <Typography variant="subtitle2" gutterBottom children={translatables.texts.teacher} />
                                <Box display="flex" alignItems="center" mb={1}>
                                    <Avatar
                                        src={user.image}
                                        variant="circular"
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            maxWidth: '100%',
                                            mx: 'auto'
                                        }}
                                        mb={1}
                                    />
                                </Box>
                                <Link href={getRoute('portal.users.view', {id : user.id})}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        children={translatables.texts.view_profile}
                                    />
                                </Link>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                    {/* <Box> */}
                                        { name }
                                    {/* </Box> */}
                                    {/* <Box> */}
                                        { specialization_data }
                                    {/* </Box> */}
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <CalendarMonthIcon />
                                        { joined_date }
                                    </Box>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Email/>
                                        { email }
                                    </Box>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
}

export default TeacherInfo
