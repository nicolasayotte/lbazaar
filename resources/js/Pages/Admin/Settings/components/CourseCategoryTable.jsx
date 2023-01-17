import { Delete, Edit } from "@mui/icons-material"
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"

const CourseCategoryTable = ({ data, handleOnEdit, handleOnDelete }) => {

    const displayTableData = (rows) => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.name} />
                <TableCell align="center" children={row.created_at} />
                <TableCell align="center">
                    <Stack spacing={1} direction="row" justifyContent="center">
                        <IconButton
                            size="small"
                            title="Edit"
                            onClick={() => handleOnEdit(row.id, row.name)}
                        >
                            <Edit fontSize="inherit" />
                        </IconButton>
                        <IconButton
                            size="small"
                            title="Delete"
                            onClick={() => handleOnDelete(row.id)}
                        >
                            <Delete color="error" fontSize="inherit" />
                        </IconButton>
                    </Stack>
                </TableCell>
            </TableRow>
        )
    })


    if (data && data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell width="70%" children="Name" />
                        <TableCell width="20%" align="center" children="Date Created" />
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

export default CourseCategoryTable
