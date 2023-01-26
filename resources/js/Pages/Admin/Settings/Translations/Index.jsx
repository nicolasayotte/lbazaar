import { Box, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../../components/forms/Input"

const Index = () => {
    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children="Translations"
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
                            <TableCell children="EN (English)" />
                            <TableCell children="JA (Japanese)" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell children="English word" />
                            <TableCell>
                                <Input
                                    placeholder="Enter japanese translation"
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
