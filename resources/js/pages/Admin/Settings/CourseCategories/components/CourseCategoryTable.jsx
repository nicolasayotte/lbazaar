import { Delete, Edit } from "@mui/icons-material"
import { IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../../components/common/EmptyCard"

const CourseCategoryTable = ({ data, handleOnEdit, handleOnDelete, translatables }) => {

    const displayTableData = (rows) => rows.map((row, index) => {

        return (
            <TableRow key={index}>
                <TableCell children={row.name} />
                <TableCell align="center" children={row.created_at} />
                <TableCell align="center">
                    <Stack spacing={1} direction="row" justifyContent="center">
                        <IconButton
                            size="small"
                            title={translatables.texts.edit}
                            onClick={() => handleOnEdit(row.id, row.name)}
                        >
                            <Edit fontSize="inherit" />
                        </IconButton>
                        <IconButton
                            size="small"
                            title={translatables.texts.delete}
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
                        <TableCell width="60%" children={translatables.texts.name} />
                        <TableCell width="25%" align="center" children={translatables.texts.date_created} />
                        <TableCell align="center" children={translatables.texts.actions} />
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
