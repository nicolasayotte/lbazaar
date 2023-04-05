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

        const isLive = row.course.is_live

        const isFullyBooked = isLive ? row.course_history.filter(booking => booking.is_cancelled != true).length == row.course.max_participant : false

        const availableSlots = row.course.max_participant - row.course_history.filter(booking => booking.is_cancelled != true).length

        const isCompleted = isLoggedIn ? auth.user.completed_schedules.includes(row.id) : false

        const ScheduleDate = () => (
            <Box>
                <Typography variant="caption" color="primary" children={startDate[0]} display="block" />
                <Typography variant="button" children={`${ startDate[1] } ${ startDate[2] } ${ startDate[3] }`} mr={1} />
                <Typography variant="caption" children={`${ startDate[4] } ${ startDate[5] } ${ startDate[6] }`} />
            </Box>
        )

        const ScheduleButton = () => {

            if (!isLoggedIn) return

            // View Schedule Button
            if (isLoggedIn && auth.user.id == row.course.professor_id) {
                return (
                    <Link href={getRoute('schedules.view', { id: row.id }) + `?return_url=${encodeURIComponent(window.location.href)}` }>
                        <Button
                            fullWidth
                            variant="contained"
                            children={translatables.title.schedules.view}
                            size="large"
                        />
                    </Link>
                )
            }

            // Book Button
            if (!isBooked) {

                const bookBtnText = `${translatables.texts.book_class} ${row.course.course_type && row.course.course_type.type == 'General' ? row.course.price : 'Free'}`

                // Live
                if (isLive) {

                    // Fully Booked
                    if (isFullyBooked) {
                        return (
                            <Button
                                fullWidth
                                variant="contained"
                                children={translatables.texts.fully_booked}
                                disabled={true}
                                size="large"
                            />
                        )
                    }

                    // Ongoing
                    if (row.status == 'Ongoing') {
                        return (
                            <Button
                                fullWidth
                                variant="contained"
                                children={bookBtnText}
                                disabled={true}
                                size="large"
                            />
                        )
                    }
                }

                // Book Button
                return (
                    <Button
                        fullWidth
                        variant="contained"
                        children={bookBtnText}
                        onClick={() => handleOnBook(row.id)}
                        disabled={!row.is_bookable}
                        size="large"
                    />
                )
            }

            // Cancel Button
            if (isBooked && row.status == 'Upcoming') {
                return (
                    <Button
                        fullWidth
                        variant="contained"
                        disabled={!row.is_cancellable}
                        children={translatables.texts.cancel_class_booking}
                        onClick={() => handleOnCancelBook(row.id)}
                        size="large"
                    />
                )
            }

            // Attend Button
            if (isBooked && row.status == 'Ongoing' && !isCompleted) {
                return (
                    <Link href={getRoute('course.attend.index', { course_id: row.course_id, schedule_id: row.id })}>
                        <Button
                            fullWidth
                            variant="contained"
                            children={translatables.texts.attend_class}
                            size="large"
                        />
                    </Link>
                )
            }

            // Complete Button
            if (isBooked && row.status == 'Ongoing' && isCompleted) {
                return (
                    <Button
                        fullWidth
                        variant="contained"
                        disabled
                        children={translatables.texts.complete}
                        size="large"
                    />
                )
            }
        }

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
                                        isLive ? (
                                        availableSlots > 0
                                        ? <Typography variant="caption" color="GrayText" children={`${availableSlots} ${translatables.texts.seats_available}`} />
                                        : <Typography variant="caption" color="GrayText" children={translatables.texts.fully_booked} /> ) : ''
                                    }
                                </Box>
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <ScheduleButton />
                        </Grid>
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
