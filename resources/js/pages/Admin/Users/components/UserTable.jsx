import { Link, usePage } from "@inertiajs/inertia-react"
import { Block, Check, Search } from "@mui/icons-material"
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const UserTable = ({ data, handleOnEnable, handleOnDisable }) => {

    const { translatables } = usePage().props

    const enableButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title={translatables.texts.enable}
            disabled={isDisabled}
            onClick={() => handleOnEnable(id)}
        >
            <Check fontSize="inherit" color={isDisabled ? 'inherit' : 'success'}/>
        </IconButton>
    )

    const disableButton = (id, isDisabled) => (
        <IconButton
            size="small"
            title={translatables.texts.disable}
            disabled={isDisabled}
            onClick={() => handleOnDisable(id)}
        >
            <Block fontSize="inherit" color={isDisabled ? 'inherit' : 'error'} />
        </IconButton>
    )

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.email}/>
            <TableCell children={row.roles.join(', ')} align="center"/>
            <TableCell children={row.status} align="center"/>
            <TableCell children={row.date_joined} align="center"/>
            <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center">
                    <Link href={getRoute('admin.users.view', { id: row.id })}>
                        <IconButton size="small" title={translatables.texts.view}>
                            <Search fontSize="inherit" />
                        </IconButton>
                    </Link>
                    {enableButton(row.id, row.is_active)}
                    {disableButton(row.id, !row.is_active)}
                </Stack>
            </TableCell>
        </TableRow>
    ))

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.name} />
                        <TableCell children={translatables.texts.email} />
                        <TableCell children={translatables.texts.role} align="center" />
                        <TableCell children={translatables.texts.status} align="center" />
                        <TableCell children={translatables.texts.date_joined} align="center" />
                        <TableCell children={translatables.texts.actions} align="center" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    { displayTableData(data) }
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default UserTable
