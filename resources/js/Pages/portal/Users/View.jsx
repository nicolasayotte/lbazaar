import { Box, Card, CardContent, Container, Divider, Grid, Typography, Link, CardMedia, Tooltip } from "@mui/material"
import routes from "../../../helpers/routes.helper"
import CertificationTable from "./components/CertificationTable"
import EducationTable from "./components/EducationTable"
import WorkHistoryTable from "./components/WorkHistoryTable"
import React from "react"
import { usePage } from "@inertiajs/inertia-react"
import PeopleIcon from "@mui/icons-material/People"
import PlayCircleIcon from "@mui/icons-material/PlayCircle"
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import LocationOnIcon from '@mui/icons-material/LocationOn'

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
            ml={1}
        />
    )

    const teacher_count = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={`${teachers.length} ${translatables.texts.teachers}`}
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
            ml={1}
        />
    )

    const Certification = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={translatables.texts.certification}
            ml={1}
        />
    )

    const Education = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={translatables.texts.education}
            ml={1}
        />
    )
    const Work = (
        <Typography
            color = {'grey'}
            variant="h5"
            children={translatables.texts.work}
            ml={1}
        />
    )

    const about_data = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.about}
            ml={1}
        />
    )

    const About = (
        <Typography
            color = {'grey'}
            variant="h6"
            children={translatables.user.about}
            ml={1}
        />
    )

    const specialization_data = (
        <Typography
            color = {'grey'}
            variant="subtitle2"
            children={user.specialty}
            ml={1}
        />
    )

    const Specialty = (
        <Typography
            color = {'grey'}
            variant="h6"
            children={translatables.user.specialty}
            ml={1}
        />
    )

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} mx="auto" py={5}>
                        <Card>
                            <Grid container  alignItems="center">
                                <Grid item xs={10} mx="auto" py={5}>
                                    <Grid container>
                                        <Grid item xs={3} mx="auto" pt={5}>
                                            <CardMedia
                                                component="img"
                                                image={user.image}
                                                sx={{
                                                    width: {
                                                        xs: '100%'
                                                    },
                                                    objectFit: 'cover',
                                                    objectPosition: 'center',
                                                    height: '250px',
                                                    borderRadius: '50%',
                                                }}
                                             />
                                            <Grid container>
                                                <Grid item xs={12} mx="auto" pt={2}>
                                                    <Divider/>
                                                    { Specialty }
                                                    { specialization_data }
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={9} mx="auto" pt={5} px={5}>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Grid container justifyContent="flex-start">
                                                    { name }
                                                </Grid>
                                                <Grid container justifyContent="flex-end">
                                                    <Tooltip title="country" arrow>
                                                        <LocationOnIcon/>
                                                    </Tooltip>
                                                    { country }
                                                </Grid>
                                            </Box>
                                            <Divider/>
                                            { roles(user) }
                                            <Grid container>
                                                <Grid item xs={12} mx="auto">
                                                    <Box display="flex" alignItems="center" mb={1}>
                                                        <Tooltip title="Date Joined" arrow>
                                                            <CalendarMonthIcon/>
                                                        </Tooltip>
                                                        { joined_date }
                                                    </Box>
                                                    <Box display="flex" alignItems="center" mb={1}>
                                                        <Tooltip title="Email" arrow>
                                                            <AlternateEmailIcon/>
                                                        </Tooltip>
                                                        { email }
                                                    </Box>
                                                    <Box display="flex" alignItems="center" mb={1}>
                                                        <Tooltip title={ is_teacher ? 'Students' : 'Teachers' }  arrow>
                                                            <PeopleIcon/>
                                                        </Tooltip>
                                                        { is_teacher ? student_count : teacher_count }
                                                    </Box>
                                                    <Box  display="flex" alignItems="center" mb={1}>
                                                        <Tooltip title={ is_teacher ? 'Classes' : 'Classes attended' } arrow>
                                                            <PlayCircleIcon/>
                                                        </Tooltip>
                                                        { is_teacher ? class_count : class_attending_count }
                                                    </Box>
                                                    <Grid container>
                                                        <Grid item xs={12} mx="auto" pt={2}>
                                                            <Divider/>
                                                            { About }
                                                            { about_data }
                                                        </Grid>
                                                    </Grid>

                                                </Grid>
                                            </Grid>

                                            <Divider/>
                                        </Grid>
                                    </Grid>
                                </Grid>
                                { is_teacher && (
                                    <Grid item xs={10}  mx="auto" py={1}>
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
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default View
