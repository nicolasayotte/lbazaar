import { Button, Paper, Table as MUITable, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"

const Table = ({ data }) => {

    const displayTableData = rows => rows.map((row, index) => (
        <TableRow key={index}>
            <TableCell children={row.name}/>
            <TableCell children={row.subject}/>
            <TableCell align="center" children={row.created_at}/>
            <TableCell align="center">
                <Button
                    variant="text"
                    size="small"
                    children="View"
                />
            </TableCell>
        </TableRow>
    ))

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <>
            <TableContainer component={Paper}>
                <MUITable>
                    <TableHead>
                        <TableRow>
                            <TableCell children="Name"/>
                            <TableCell children="Subject"/>
                            <TableCell align="center" children="Date"/>
                            <TableCell align="center" children="Actions"/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayTableData(data)}
                    </TableBody>
                </MUITable>
            </TableContainer>
        </>
    )
}

export default Table
