import { Delete, Edit } from "@mui/icons-material"
import { IconButton, Stack, TableCell, TableRow } from "@mui/material"

const ClassificationTableRow = ({ data, index, handleOnDeleteRow, handleOnEditRow }) => {
    return (
        <TableRow>
            <TableCell children={data.name} />
            <TableCell align="center" children={data.commision_rate} />
            <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                        title="Edit"
                        size="small"
                        onClick={() => handleOnEditRow(data.id, data.name, data.commision_rate)}
                    >
                        <Edit fontSize="inherit" />
                    </IconButton>
                    <IconButton
                        title="Delete"
                        size="small"
                        onClick={() => handleOnDeleteRow(data.id, index)}
                    >
                        <Delete color="error" fontSize="inherit" />
                    </IconButton>
                </Stack>
            </TableCell>
        </TableRow>
    )
}

export default ClassificationTableRow
