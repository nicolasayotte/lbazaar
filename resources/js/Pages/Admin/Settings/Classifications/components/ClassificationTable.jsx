import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"
import ClassificationTableRow from "./ClassificationTableRow"

const ClassificationTable = ({ data, handleOnDeleteRow, handleOnEditRow }) => {

    const displayTableData = data => data.map((row, index) => (
        <ClassificationTableRow
            data={row}
            key={index}
            handleOnDeleteRow={handleOnDeleteRow}
            handleOnEditRow={handleOnEditRow}
        />
    ))

    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell width="70%" children="Classification" />
                        <TableCell align="center" children="Commission Rate (%)" />
                        <TableCell align="center" children="Actions" />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {displayTableData(data)}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default ClassificationTable
