import { Link, usePage } from "@inertiajs/inertia-react"
import { CalendarMonth } from "@mui/icons-material"
import { Box, Button, Grid, Paper, Stack, Typography } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const CourseScheduleList = ({ data, handleOnBook, handleOnCancelBook }) => {

    const { isLoggedIn, translatables, auth } = usePage().props

    if (data && data.length <= 0) {
        return (
            <Box sx={{ mb: 2 }}>
                <EmptyCard condensed message={translatables.texts.no_schedules_available} />
            </Box>
        )
    }

    const Schedules = () => data && data.length > 0 && data.map((row, index) => {

        const startDate = row.formatted_start_datetime.split(' ')

        const userBookedCourses = isLoggedIn ? auth.user.course_histories.filter(booking => booking.is_cancelled != true) : []

        const isBooked = userBookedCourses.filter(booking => booking.course_schedule_id === row.id).length > 0

        const isFullyBooked = row.course_history.filter(booking => booking.is_cancelled != true).length == row.course.max_participant

        const availableSlots = row.course.max_participant - row.course_history.filter(booking => booking.is_cancelled != true).length

        const ScheduleDate = () => (
            <Box>
                <Typography variant="caption" color="primary" children={startDate[0]} display="block" />
                <Typography variant="button" children={`${ startDate[1] } ${ startDate[2] } ${ startDate[3] }`} mr={1} />
                <Typography variant="caption" children={`${ startDate[4] } ${ startDate[5] } ${ startDate[6] }`} />
            </Box>
        )

        return (
            <Grid key={index} item xs={12}>
                <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={8}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <CalendarMonth fontSize="large" />
                                <Box>
                                    <ScheduleDate />
                                    {
                                        availableSlots > 0
                                        ? <Typography variant="caption" color="GrayText" children={`${availableSlots} ${translatables.texts.seats_available}`} />
                                        : <Typography variant="caption" color="GrayText" children={translatable.texts.fully_booked} />
                                    }
                                </Box>
                            </Stack>
                        </Grid>
                        {
                            isLoggedIn &&
                            <Grid item xs={12} md={4}>
                                {
                                    !isBooked && !isFullyBooked &&
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            children={`${translatables.texts.book_class} ${row.course.course_type && row.course.course_type.type == 'General' ? row.course.price : 'Free'}`}
                                            onClick={() => handleOnBook(row.id)}
                                            size="large"
                                        />
                                }
                                {
                                    isBooked && row.status == 'Upcoming' &&
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        disabled={!row.is_cancellable}
                                        children={translatables.texts.cancel_class_booking}
                                        onClick={() => handleOnCancelBook(row.id)}
                                        size="large"
                                    />
                                }
                                {
                                    isBooked && row.status == 'Ongoing' &&
                                    <Link href={getRoute('course.attend.index', { course_id: row.course_id, schedule_id: row.id })}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            children={translatables.texts.attend_class}
                                            size="large"
                                        />
                                    </Link>
                                }
                            </Grid>
                        }
                    </Grid>
                </Paper>
            </Grid>
        )
    })

    return (
        <Box sx={{ mb:2 }}>
            <Grid container spacing={2}>
                <Schedules />
            </Grid>
        </Box>
    )
}

export default CourseScheduleList
