import { usePage, Link } from "@inertiajs/inertia-react"
import { Paper, Table, TableBody, TableContainer, TableHead, TableRow, Stack, IconButton, Tooltip, Typography, Grid } from "@mui/material"
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import { styled } from '@mui/material/styles';
import routes, { getRoute } from "../../../../helpers/routes.helper"
import { PeopleAlt, BookmarkAdd as BookCourse, BookmarkRemove as CancelBook, ContentPasteGo as AttendClass, VideoCameraFront as Live, PlayCircle as OnDemand } from "@mui/icons-material"


const CourseScheduleTable = ({ id, data, handleOnCancelBook, handleOnBook }) => {

    const { translatables, auth, isLoggedIn } = usePage().props

    const StyledTableCell = styled(TableCell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.common.white,
        },
        [`&.${tableCellClasses.body}`]: {
          fontSize: 14,
        },
      }));

      const StyledTableRow = styled(TableRow)(({ theme }) => ({
        '&:nth-of-type(odd)': {
          backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        '&:last-child td, &:last-child th': {
          border: 0,
        },
      }));

    function filterCancelledBookings(booking) {
        return booking.is_cancelled != true;
    }

    function displayisLiveOrOnDemand(schedule) {
        return (
            <Grid container spacing={1} alignItems={'center'}>
                <Grid item>
                    { schedule.course.is_live  ? <Live sx={{ color: '#dc143c' }}/> : <OnDemand color="primary"/> }
                </Grid>
                <Grid item>
                    <Typography
                        color = {'grey'}
                        variant="subtitle2"
                        children={schedule.course.is_live ? translatables.texts.live : translatables.texts.on_demand}
                    />
                </Grid>
            </Grid>
        );
    }

    function displayParticipants(schedule) {
        return (
            <Grid container spacing={1} alignItems={'center'}>
                <Grid item >
                    <PeopleAlt />
                </Grid>
                <Grid item>
                    <Typography
                        color = {'grey'}
                        variant="subtitle2"
                        children={`${schedule.course_history.filter(filterCancelledBookings).length} / ${schedule.max_participant}`}
                    />
                </Grid>
            </Grid>
        );
    }

    const displayTableData = rows => rows.map((row, index) => {

        let userBookedCourses = isLoggedIn ? auth.user.course_histories.filter(filterCancelledBookings) : []
        let isBooked = userBookedCourses.filter(booking => booking.course_schedule_id === row.id).length > 0
        let isFullyBooked = row.course_history.filter(filterCancelledBookings).length == row.max_participant

        return (
            <StyledTableRow key={index}>
                <StyledTableCell children={row.start_datetime}/>
                <StyledTableCell>
                    { displayParticipants(row) }
                </StyledTableCell>
                <StyledTableCell>
                    { displayisLiveOrOnDemand(row) }
                </StyledTableCell>
                <StyledTableCell>
                    <Stack direction="row" spacing={1} justifyContent="center">
                        { isBooked && (
                            <>
                                <Tooltip title={`${translatables.texts.attend_class}`}>
                                    <Link href={getRoute('mypage.course.applications.view', { id: row.id }, {returnUrl : routes["mypage.course.applications.index"]})}>
                                        <IconButton size="small">
                                            <AttendClass color="primary"/>
                                        </IconButton>
                                    </Link>
                                </Tooltip>
                                <Tooltip title={`${translatables.texts.cancel_class_booking}`}>
                                    <IconButton size="small" onClick={() => handleOnCancelBook(row.id)}>
                                            <CancelBook sx={{ color: '#dc143c' }} />
                                    </IconButton>
                                </Tooltip>
                             </>
                        )}
                        { !isBooked && !isFullyBooked && (
                            <Tooltip title={`${translatables.texts.book_class}`}>
                                <IconButton size="small" onClick={() => handleOnBook(row.id)}>
                                        <BookCourse color="success" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </StyledTableCell>

            </StyledTableRow>
        )
    })
    return (
        <>
            <TableContainer id={id} component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell children={translatables.class_schedule.start_date} />
                            <StyledTableCell children={translatables.class_schedule.number_users_booked} />
                            <StyledTableCell children={translatables.class_schedule.class_style} />
                            <StyledTableCell children={`${translatables.texts.attend} / ${translatables.texts.book} / ${translatables.texts.cancel}`} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayTableData(data)}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default CourseScheduleTable
