import { Delete } from "@mui/icons-material"
import { IconButton, TableCell, TableRow } from "@mui/material"
import Input from "../../../../../components/forms/Input"

const ClassificationTableRow = ({ data, index, handleOnDeleteRow }) => {
    return (
        <TableRow>
            <TableCell>
                <Input
                    placeholder="Name"
                    value={data.name}
                />
            </TableCell>
            <TableCell>
                <Input
                    placeholder="Percentage 1-100"
                    value={data.commision_rate}
                />
            </TableCell>
            <TableCell align="center">
                <IconButton title="Delete" size="small" onClick={() => handleOnDeleteRow(data.id, index)}>
                    <Delete color="error" fontSize="inherit" />
                </IconButton>
            </TableCell>
        </TableRow>
    )
}

export default ClassificationTableRow
