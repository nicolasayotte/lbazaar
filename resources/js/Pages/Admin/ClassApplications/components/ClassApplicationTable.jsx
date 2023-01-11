import { Block, Check, Search } from "@mui/icons-material"
import { Box, Chip, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"

const ClassApplicationTable = ({ data, handleOnApprove, handleOnDeny }) => {

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
                        title="Enable"
                        disabled={disabled}
                        onClick={() => handleOnApprove(id)}
                    >
                        <Check fontSize="inherit" color={disabled ? 'inherit' : 'success'}/>
                    </IconButton>
                    <IconButton
                        size="small"
                        title="Disabled"
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
                <TableCell children={row.professor}/>
                <TableCell align="center" children={row.type}/>
                <TableCell align="center" children={row.category}/>
                <TableCell align="center" children={row.price}/>
                <TableCell align="center" children={row.created_at}/>
                <TableCell align="center">
                    <Chip size="small" label={row.status} color={statusColors[row.status]}/>
                </TableCell>
                <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small">
                            <Search fontSize="inherit"/>
                        </IconButton>
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
                            <TableCell children="Title"/>
                            <TableCell children="Teacher"/>
                            <TableCell align="center" children="Type"/>
                            <TableCell align="center" children="Category"/>
                            <TableCell align="center" children="Price"/>
                            <TableCell align="center" children="Date Applied"/>
                            <TableCell align="center" children="Status"/>
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

export default ClassApplicationTable
