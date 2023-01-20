import { Add, Delete } from "@mui/icons-material"
import { Box, Button, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"

const Index = () => {
    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children="Classifications"
                />
                <Button
                    children="Save Changes"
                    variant="contained"
                />
            </Stack>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell width="70%" children="Classification" />
                            <TableCell children="Commission Rate (%)" />
                            <TableCell align="center" children="Actions" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Input
                                    placeholder="Name"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Percentage 1-100"
                                />
                            </TableCell>
                            <TableCell align="center">
                                <IconButton title="Delete" size="small">
                                    <Delete color="error" fontSize="inherit" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
            <Box textAlign="center">
                <Button
                    children="Add row"
                    variant="outlined"
                    startIcon={<Add />}
                />
            </Box>
        </Box>
    )
}

export default Index
