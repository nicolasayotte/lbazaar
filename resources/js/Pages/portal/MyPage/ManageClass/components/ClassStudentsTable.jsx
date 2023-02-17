import { Link } from "@inertiajs/inertia-react"
import { Search, DisabledByDefault, CheckBox } from "@mui/icons-material"
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { getRoute } from "../../../../../helpers/routes.helper"

const ClassStudentsTable = ({ data, handleOnComplete, handleOnOngoing }) => {

    const completeButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title="Completed"
            disabled={isDisabled}
            color="success"
            onClick={() => handleOnComplete(id)}
        >
            <CheckBox fontSize="inherit"/>
        </IconButton>
    )

    const ongoingButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title="Unfinished"
            disabled={isDisabled}
            color="warning"
            onClick={() => handleOnOngoing(id)}
        >
            <DisabledByDefault fontSize="inherit" />
        </IconButton>
    )

    const displayTableData = rows => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.studentId}/>
                <TableCell children={row.fullname}/>
                <TableCell children={row.bookedDate}/>
                <TableCell children={row.completedAt}/>
                <TableCell sx={{ whiteSpace: 'nowrap'}} align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link title="View Student" href={getRoute('portal.users.view', { id: row.studentId })}>
                            <IconButton size="small" title="View">
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
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell children="Student ID"/>
                            <TableCell children="Full Name"/>
                            <TableCell children="Booked Date"/>
                            <TableCell children="Completed Date"/>
                            <TableCell align="center" children="Actions"/>
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

export default ClassStudentsTable
