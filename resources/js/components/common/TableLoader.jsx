import { Paper, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"

const TableLoader = () => {

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell width={20}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={100}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow>
                        <TableCell width={20}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={100}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width={20}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={100}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width={20}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={100}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell width={20}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={100}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                        <TableCell width={5}>
                            <Skeleton variant="text"/>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default TableLoader
