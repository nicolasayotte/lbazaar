import { Box, Container, Grid, Typography, Tooltip, Avatar, Stack, Chip, useMediaQuery, useTheme } from "@mui/material"
import { usePage } from "@inertiajs/inertia-react"
import { CalendarMonth, LocationOn, LibraryBooks, TipsAndUpdates, FormatQuote, School, Work, Verified } from "@mui/icons-material"
import { Timeline, TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineSeparator, timelineItemClasses } from "@mui/lab"

const View  = () => {

    const { user, is_teacher, translatables } = usePage().props

    const theme = useTheme()

    const UserInformation = () => {

        const items = [
            {
                label: translatables.user.specialty,
                value: user.specialty,
                icon: <TipsAndUpdates fontSize="small" color="warning" />,
                roles: ['teacher']
            },
            {
                label: translatables.texts.country,
                value: user.country.name,
                icon: <LocationOn fontSize="small" color="primary" />,
                roles: ['teacher', 'student']
            },
            {
                label: translatables.texts.date_joined,
                value: user.created_at,
                icon: <CalendarMonth fontSize="small" color="error" />,
                roles: ['teacher', 'student']
            },
            {
                label: translatables.texts.classes,
                value: `${ user.created_courses.length } ${translatables.texts.classes}`,
                icon: <LibraryBooks fontSize="small" color="success" />,
                roles: ['teacher']
            },
            {
                label: translatables.texts.badges,
                value: user.badges && user.badges.length > 0 ? user.badges.length : 0,
                icon: <Verified fontSize="small" color="warning" />,
                roles: ['teacher', 'student']
            }
        ]

        const informationItems = () => items.map((item, index) => {

            const matchedRoles = user.roles.filter(role => item.roles.includes(role.name))

            if (matchedRoles.length > 0) {
                return (
                    <Tooltip key={index} title={item.label}>
                        <Chip
                            variant="outlined"
                            icon={item.icon}
                            label={item.value}
                            sx={{
                                width: { xs: '100%', md: 'auto' }
                            }}
                        />
                    </Tooltip>
                )
            }
        })

        return (
            <Stack
                direction={{
                    xs: 'column',
                    md: 'row'
                }}
                spacing={1}
                alignItems="center"
                justifyContent="center"
                children={informationItems()}
                sx={{ my: 2 }}
            />
        )
    }

    const About = () => user.about && (
        <Grid item xs={12}>
            <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2}>
                <FormatQuote sx={{ fontSize: { xs: '50px', md: '100px' } }} color="action" />
                <Typography variant="body1" children={user.about} sx={{ fontStyle: 'italic', textAlign: 'left' }} />
            </Stack>
        </Grid>
    )

    const UserInfoTimeLine = ({ data, title, Icon }) => {

        if (is_teacher && data && data.length > 0) {

            const children = data.map((content, index) => (
                <TimelineItem key={index}>
                    <TimelineSeparator>
                        <TimelineDot>
                            <Icon />
                        </TimelineDot>
                        {
                            index + 1 < data.length &&
                            <TimelineConnector />
                        }
                    </TimelineSeparator>
                    <TimelineContent children={content} />
                </TimelineItem>
            ))

            return (
                <Grid item xs={12}>
                    <Typography variant="h5" display="flex" alignItems="center" justifyContent="center">
                        <Icon fontSize="large" sx={{ mr: 1 }} />
                        <span>{ title }</span>
                    </Typography>
                    <Timeline
                        sx={useMediaQuery(theme.breakpoints.down('md')) && {
                            [`& .${timelineItemClasses.root}:before`]: {
                                flex: 0,
                                padding: 0,
                            }
                        }}
                        position={useMediaQuery(theme.breakpoints.down('md')) ? 'right' : 'alternate'}
                        children={children}
                    />
                </Grid>
            )
        }
    }

    const UserEducation = () => {

        if (!is_teacher) return

        const userEducation = user.user_education && user.user_education.length > 0 && user.user_education.map(education => (
            <>
                <Typography variant="h6" children={education.degree} />
                <Typography variant="subtitle1" color="primary" children={education.school} />
                <Typography variant="caption" color="GrayText" children={`${education.start_date} — ${education.end_date}`} />
            </>
        ))

        return <UserInfoTimeLine title={translatables.education.background} data={userEducation} Icon={School} />
    }

    const UserWorkHistory = () => {

        if (!is_teacher) return

        const userWorkHistory = user.user_work_history && user.user_work_history.length > 0 && user.user_work_history.map(workHistory => (
            <>
                <Typography variant="h6" children={workHistory.position} />
                <Typography variant="subtitle1" color="primary" children={workHistory.company} />
                <Typography variant="caption" color="GrayText" children={`${workHistory.start_date} — ${workHistory.end_date}`} />
                {
                    workHistory.description &&
                    <Typography variant="body2" children={workHistory.description} />
                }
            </>
        ))

        return <UserInfoTimeLine title={translatables.work.history} data={userWorkHistory} Icon={Work} />
    }

    const UserCertification = () => {

        if (!is_teacher) return

        const userCertification = user.user_certification && user.user_certification.length > 0 && user.user_certification.map(certification => (
            <>
                <Typography variant="h6" children={certification.title} />
                <Typography variant="subtitle1" color="primary" children={certification.awarded_by} />
                <Typography variant="caption" color="GrayText" children={certification.awarded_at} />
            </>
        ))

        return <UserInfoTimeLine title={translatables.texts.certification} data={userCertification} Icon={Verified} />
    }

    return (
        <Box py={5}>
            <Container>
                <Grid container minHeight="100vh">
                    <Grid item xs={12} container spacing={useMediaQuery(theme.breakpoints.down('md')) ? 2 : 4} justifyContent="center">
                        <Grid item xs={12} textAlign="center">
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
                            <Typography variant="h4" children={user.fullname} sx={{ mt: 2 }} />
                            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                                <a href={`mailto:${user.email}`} target="_blank" children={user.email} />
                            </Typography>
                            <UserInformation />
                        </Grid>
                        {
                            is_teacher && (
                                <>
                                    <About />
                                    <UserEducation />
                                    <UserWorkHistory />
                                    <UserCertification />
                                </>
                            )
                        }
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default View
