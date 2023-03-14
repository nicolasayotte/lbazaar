import { Link } from "@inertiajs/inertia-react"
import { Search, InsertComment, LocalPolice as BadgeIcon } from "@mui/icons-material"
import { Box, IconButton, Chip, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import route, { getRoute } from "../../../../../helpers/routes.helper"
import { usePage } from '@inertiajs/inertia-react'

const CourseHistoryTable = ({ data }) => {
    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => {

        const Package = () => (
            row.isPackage &&
            <Chip color="default" label={translatables.texts.package} size="small" variant="outlined" />
        )

        const Badge = () => (
            row.hasBadge &&
            <BadgeIcon />
        )

        const statusColors = {
            'Ongoing' : 'default',
            'Completed': 'success'
        }

        return (
            <TableRow key={index}>
                <TableCell children={row.title} align="center"/>
                <TableCell children={row.type} align="center"/>
                <TableCell children={row.category} align="center"/>
                <TableCell children={row.teacher} align="center"/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} children={row.booked_date} align="center"/>
                <TableCell align="center">
                    <Chip size="small" label={row.status} color={statusColors[row.status]}/>
                </TableCell>
                <TableCell align="center">
                    <Box justifyContent={'center'}>
                        <Package />
                    </Box>
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link href={getRoute('course.details', {id : row.id})}>
                            <IconButton title="View" variant="text" size="small">
                                <Search fontSize="inherit" />
                            </IconButton>
                        </Link>
                    </Stack>
                </TableCell>
            </TableRow>
        )
    })

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.classes} align="center"/>
                        <TableCell children={translatables.texts.type} align="center"/>
                        <TableCell children={translatables.texts.category} align="center"/>
                        <TableCell children={translatables.texts.teacher} align="center"/>
                        <TableCell children={translatables.texts.booked_date} align="center"/>
                        <TableCell children={translatables.texts.status} align="center"/>
                        <TableCell children={translatables.texts.package} align="center"/>
                        <TableCell children={translatables.texts.actions} align="center"/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData(data) }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default CourseHistoryTable
