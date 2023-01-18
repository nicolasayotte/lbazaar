import { usePage } from "@inertiajs/inertia-react"
import { Add } from "@mui/icons-material"
import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"

const Index = () => {

    const { title } = usePage().props

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children={title}
                />
                <Button
                    children="Save Changes"
                    variant="contained"
                />
            </Stack>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell children="Class Type" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Input
                                    placeholder="Class Type"
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Input
                                    placeholder="Class Type"
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Input
                                    placeholder="Class Type"
                                />
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Input
                                    placeholder="Class Type"
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default Index
