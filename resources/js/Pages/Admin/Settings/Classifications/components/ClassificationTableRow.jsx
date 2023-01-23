import { Delete, Edit } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow } from "@mui/material"
import Input from "../../../../../components/forms/Input"

const ClassificationTableRow = ({ data, index, handleOnDeleteRow }) => {
    return (
        <TableRow>
            <TableCell children={data.name} />
            <TableCell align="center" children={data.commision_rate} />
            <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton title="Edit" size="small">
                        <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton title="Delete" size="small" onClick={() => handleOnDeleteRow(data.id, index)}>
                        <Delete color="error" fontSize="inherit" />
                    </IconButton>
                </Stack>
            </TableCell>
        </TableRow>
    )
}

export default ClassificationTableRow
