import { Search } from "@mui/icons-material"
import { Checkbox, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"

const ClassApplicationTable = () => {
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
                            <TableCell align="center" children="Format"/>
                            <TableCell align="center" children="Category"/>
                            <TableCell align="center" children="Price"/>
                            <TableCell align="center" children="Date Applied"/>
                            <TableCell align="center" children="Actions"/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Checkbox />
                            </TableCell>
                            <TableCell children="Lorem Ipsum"/>
                            <TableCell children="John Smith"/>
                            <TableCell align="center" children="General"/>
                            <TableCell align="center" children="On-Demand"/>
                            <TableCell align="center" children="WEB 3"/>
                            <TableCell align="center" children="Free"/>
                            <TableCell align="center" children="2022-01-10"/>
                            <TableCell align="center">
                                <IconButton size="small">
                                    <Search fontSize="inherit"/>
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}

export default ClassApplicationTable
