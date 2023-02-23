import { Link, usePage } from "@inertiajs/inertia-react"
import { Delete, Edit } from "@mui/icons-material"
import { IconButton, Paper, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material"
import { Stack } from "@mui/system"
import EmptyCard from "../../../../../components/common/EmptyCard"
import { getRoute } from "../../../../../helpers/routes.helper"

const ExamTable = ({ data, handleOnStatusToggle, handleOnDelete }) => {

    const { translatables } = usePage().props

    const statusToggleValues = {
        'active': 'disabled',
        'disabled': 'active'
    }

    const displayTableData = data.map((item, index) => {

        const actionButtons = (
            <Stack direction="row" spacing={2} width="100%" justifyContent="center">
                <Link href={getRoute('exams.edit', { id: item.id })}>
                    <Tooltip title={translatables.texts.edit}>
                        <IconButton size="small">
                            <Edit fontSize="inherit" />
                        </IconButton>
                    </Tooltip>
                </Link>
                <Tooltip title={translatables.texts.delete}>
                    <IconButton color="error" size="small" onClick={() => handleOnDelete(item.id)}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>
        )

        return (
            <TableRow key={index}>
                <TableCell children={item.name} />
                <TableCell align="center" children={item.total_items} />
                <TableCell align="center" children={item.total_points} />
                <TableCell align="center">
                    <Switch
                        checked={item.status === 'active'}
                        color="success"
                        onChange={() => handleOnStatusToggle(item.id, statusToggleValues[item.status])}
                    />
                </TableCell>
                <TableCell align="center">
                    { actionButtons }
                </TableCell>
            </TableRow>
        )
    })

    if (data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.name} />
                        <TableCell align="center" children={translatables.texts.total_items} />
                        <TableCell align="center" children={translatables.texts.total_points} />
                        <TableCell align="center" children={translatables.texts.status} />
                        <TableCell align="center" children={translatables.texts.actions} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default ExamTable
