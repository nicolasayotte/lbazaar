import { Link, usePage } from "@inertiajs/inertia-react"
import { Delete, Search } from "@mui/icons-material"
import { Box, Chip, Button, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { getRoute } from "../../../../../helpers/routes.helper"

const ScheduleTable = ({ data, handleOnDelete }) => {

    const { translatables } = usePage().props

    if (data.length <= 0) {
        return <EmptyCard />
    }

    const statusColors = {
        'Upcoming': 'default',
        'Ongoing': 'primary',
        'Done': 'success'
    }

    const handleOnMint = () => {
        alert('Would open the wallet sign transaction popup with the students NFTs')
    }

    const displayTableData = schedules => schedules.map((schedule, index) => {

        schedule.status = 'Done'
        const startDate = schedule.formatted_start_datetime.split(' ')
        const isLive = schedule.course.is_live
        const ScheduleDate = () => (
            <Box>
                <Typography variant="caption" color="primary" children={startDate[0]} display="block" />
                <Typography variant="button" children={`${startDate[1]} ${startDate[2]} ${startDate[3]}`} mr={1} />
                <Typography variant="caption" children={`${startDate[4]} ${startDate[5]} ${startDate[6]}`} />
            </Box>
        )

        return (
            <TableRow key={index}>
                <TableCell children={<ScheduleDate />} />
                <TableCell align="center">
                    {isLive ? schedule.total_bookings + ' / ' + schedule.max_participant : schedule.total_bookings}
                </TableCell>
                <TableCell align="center">
                    <Chip color={statusColors[schedule.status]} label={schedule.status} />
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <Link href={getRoute('schedules.view', { id: schedule.id })}>
                            <IconButton size="small" title={translatables.texts.view}>
                                <Search fontSize="inherit" />
                            </IconButton>
                        </Link>
                        <Button
                            disabled={schedule.status !== 'Done'}
                            size="medium"
                            onClick={() => handleOnMint(schedule.id)}
                        >
                            Mint
                        </Button>
                        <IconButton
                            disabled={!schedule.is_deletable}
                            size="small"
                            title={translatables.texts.delete}
                            onClick={() => handleOnDelete(schedule.id)}
                        >
                            <Delete fontSize="inherit" color={!schedule.is_deletable ? 'disabled' : 'error'} />
                        </IconButton>
                    </Stack>
                </TableCell>
            </TableRow>
        )
    })

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.date} />
                        <TableCell align="center" children={translatables.class_schedule.number_users_booked} />
                        <TableCell align="center" children={translatables.texts.status} />
                        <TableCell align="center" children={translatables.texts.actions} />
                    </TableRow>
                </TableHead>
                <TableBody children={displayTableData(data)} />
            </Table>
        </TableContainer>
    )
}

export default ScheduleTable
