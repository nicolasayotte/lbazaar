import { usePage } from "@inertiajs/inertia-react"
import { Delete, Search } from "@mui/icons-material"
import { Box, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"

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

    const displayTableData = schedules => schedules.map((schedule, index) => {

        const startDate = schedule.formatted_start_datetime.split(' ')

        const ScheduleDate = () => (
            <Box>
                <Typography variant="caption" color="primary" children={startDate[0]} display="block" />
                <Typography variant="button" children={`${ startDate[1] } ${ startDate[2] } ${ startDate[3] }`} mr={1} />
                <Typography variant="caption" children={`${ startDate[4] } ${ startDate[5] }`} />
            </Box>
        )

        return (
            <TableRow key={index}>
                <TableCell children={<ScheduleDate />} />
                <TableCell align="center" children={`${schedule.total_bookings} / ${schedule.max_participant}`} />
                <TableCell align="center">
                    <Chip color={statusColors[schedule.status]} label={schedule.status} />
                </TableCell>
                <TableCell>
                    <Stack direction="row" spacing={2} justifyContent="center">
                        <IconButton size="small" title={translatables.texts.view}>
                            <Search fontSize="inherit" />
                        </IconButton>
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
                        <TableCell children="Date" />
                        <TableCell align="center" children="Bookings" />
                        <TableCell align="center" children="Status" />
                        <TableCell align="center" children="Actions" />
                    </TableRow>
                </TableHead>
                <TableBody children={displayTableData(data)} />
            </Table>
        </TableContainer>
    )
}

export default ScheduleTable
