import { Search } from "@mui/icons-material"
import { Checkbox, Chip, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"

const ClassApplicationTable = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => {

        const statusComponent = (status) => {

            let statusColor = 'default'

            if (status === 'Approved') {
                statusColor = 'success'
            }

            if (status === 'Denied') {
                statusColor = 'error'
            }

            return (
                <Chip size="small" label={status} color={statusColor}/>
            )
        }

        return (
            <TableRow key={index}>
                <TableCell>
                    <Checkbox />
                </TableCell>
                <TableCell children={row.title}/>
                <TableCell children={row.professor}/>
                <TableCell align="center" children={row.type}/>
                <TableCell align="center" children={row.category}/>
                <TableCell align="center" children={row.price}/>
                <TableCell align="center" children={row.created_at}/>
                <TableCell align="center" children={statusComponent(row.status)}/>
                <TableCell align="center">
                    <IconButton size="small">
                        <Search fontSize="inherit"/>
                    </IconButton>
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
                            <TableCell width="1%">
                                <Checkbox />
                            </TableCell>
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
