import { Box, Card, CardContent, Container, Divider, Grid, Typography, Tooltip, Avatar } from "@mui/material"
import CertificationTable from "./components/CertificationTable"
import EducationTable from "./components/EducationTable"
import WorkHistoryTable from "./components/WorkHistoryTable"
import { usePage } from "@inertiajs/inertia-react"
import PlayCircleIcon from "@mui/icons-material/PlayCircle"
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import { Email } from "@mui/icons-material"

const View  = () => {

    const { user, is_teacher, translatables, students, teachers } = usePage().props
    const name = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={`${user.first_name} ${user.last_name}`}
            style={{ flex: 1 }}
        />
    )

    const roles = (user) => user.roles && user.roles.length > 0 && user.roles.map((role, index) => (
        <Typography
            color = {'primary'}
            key={index}
            variant="subtitle2"
            children={`${role.name.charAt(0).toUpperCase() + role.name.slice(1)}`}
        />
    ))

    const email = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.email}
            ml={1}
        />
    )

    const country = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.country.name}
            ml={1}
        />
    )

    const student_count = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={`${students.length} ${translatables.texts.students}`}
        />
    )

    const teacher_count = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={`${teachers.length} ${translatables.texts.teachers}`}
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

    const class_count = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={`${user.created_courses.length} ${translatables.texts.classes}`}
            ml={1}
        />
    )

    const class_attending_count = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={`${user.courses.length} ${translatables.texts.classes_booked}`}
        />
    )

    const Certification = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={translatables.texts.certification}
            gutterBottom
        />
    )

    const Education = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={translatables.texts.education}
            gutterBottom
        />
    )
    const Work = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={translatables.texts.work}
            gutterBottom
        />
    )

    const about_data = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.about}
            lineHeight={1.8}
            gutterBottom
        />
    )

    const About = (
        <Typography
            color = {'grey'}
            variant="h6"
            children={translatables.user.about}
            gutterBottom
            textAlign={{ xs: 'center', md: 'left' }}
        />
    )

    const specialization_data = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.specialty}
        />
    )

    const Specialty = (
        <Typography
            color = {'grey'}
            variant="h6"
            children={translatables.user.specialty}
        />
    )

    return (
        <Box sx={{ minHeight: '80.75vh', py: 5 }}>
            <Container>
                <Card>
                    <CardContent>
                        <Grid container>
                            <Grid item xs={12} md={11} mx="auto" py={4}>
                                <Grid container alignItems="center" spacing={{ xs: 2, md: 5 }}>
                                    <Grid item xs={12} md={3}>
                                        <Avatar
                                            src={user.image}
                                            variant="circular"
                                            sx={{
                                                width: 200,
                                                height: 200,
                                                maxWidth: '100%',
                                                mx: 'auto'
                                            }}
                                        />
                                        <Box textAlign="center" my={2}>
                                            { name }
                                            { specialization_data }
                                            { roles(user) }
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={9}>
                                        { About }
                                        { about_data }
                                        <Divider sx={{ my: 2 }}/>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Tooltip title="country" arrow>
                                                <LocationOnIcon/>
                                            </Tooltip>
                                            { country }
                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Tooltip title="Date Joined" arrow>
                                                <CalendarMonthIcon/>
                                            </Tooltip>
                                            { joined_date }
                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <Tooltip title="Email" arrow>
                                                <Email/>
                                            </Tooltip>
                                            { email }
                                        </Box>
                                        {
                                            is_teacher &&
                                            <Box  display="flex" alignItems="center" mb={1}>
                                                <Tooltip title="Classes" arrow>
                                                    <PlayCircleIcon/>
                                                </Tooltip>
                                                { class_count }
                                            </Box>
                                        }
                                    </Grid>
                                </Grid>
                            </Grid>
                            { is_teacher && (
                                <Grid item xs={12} md={11} mx="auto" py={1}>
                                    <Grid container>
                                        <Grid item xs={12} mx="auto" py={1}>
                                            <Grid container>
                                                <Grid item xs={12} mx="auto">
                                                    { Certification }
                                                    <CertificationTable data={user.user_certification}/>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} mx="auto" py={1}>
                                            <Grid container>
                                                <Grid item xs={12} mx="auto">
                                                    { Work }
                                                    <WorkHistoryTable data={user.user_work_history}/>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} mx="auto" py={5}>
                                            <Grid container>
                                                <Grid item xs={12} mx="auto">
                                                    { Education }
                                                    <EducationTable data={user.user_education}/>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    )
}

export default View
