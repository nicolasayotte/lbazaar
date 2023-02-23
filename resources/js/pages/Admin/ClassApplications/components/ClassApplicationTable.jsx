import { Link, usePage } from "@inertiajs/inertia-react"
import { Block, Check, Search } from "@mui/icons-material"
import { Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const ClassApplicationTable = ({ data, handleOnApprove, handleOnDeny }) => {

    const { translatables } = usePage().props

    const displayTableData = rows => rows.map((row, index) => {

        const isPending = row.status === 'Pending'

        const statusColors = {
            'Pending' : 'default',
            'Approved': 'success',
            'Denied'  : 'error'
        }

        const actionButtons = (id, disabled) => {
            return (
                <>
                    <IconButton
                        size="small"
                        title={translatables.texts.enable}
                        disabled={disabled}
                        onClick={() => handleOnApprove(id)}
                    >
                        <Check fontSize="inherit" color={disabled ? 'inherit' : 'success'}/>
                    </IconButton>
                    <IconButton
                        size="small"
                        title={translatables.texts.disable}
                        disabled={disabled}
                        onClick={() => handleOnDeny(id)}
                    >
                        <Block fontSize="inherit" color={disabled ? 'inherit' : 'error'} />
                    </IconButton>
                </>
            )
        }

        return (
            <TableRow key={index}>
                <TableCell children={row.title}/>
                <TableCell children={row.professor_name}/>
                <TableCell align="center" children={row.type}/>
                <TableCell align="center" children={row.category}/>
                <TableCell align="center" children={row.price}/>
                <TableCell align="center" children={row.created_at}/>
                <TableCell align="center">
                    <Chip size="small" label={row.status} color={statusColors[row.status]}/>
                </TableCell>
                <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <Link href={getRoute('admin.class.applications.view', { id: row.id })}>
                            <IconButton size="small" title={translatables.texts.view}>
                                <Search fontSize="inherit"/>
                            </IconButton>
                        </Link>
                        {actionButtons(row.id, !isPending)}
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
                            <TableCell children={translatables.texts.title} />
                            <TableCell children={translatables.texts.teacher} />
                            <TableCell align="center" children={translatables.texts.type} />
                            <TableCell align="center" children={translatables.texts.category} />
                            <TableCell align="center" children={translatables.texts.price} />
                            <TableCell align="center" children={translatables.texts.date_applied} />
                            <TableCell align="center" children={translatables.texts.status} />
                            <TableCell align="center" children={translatables.texts.actions} />
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

export default ClassApplicationTable
