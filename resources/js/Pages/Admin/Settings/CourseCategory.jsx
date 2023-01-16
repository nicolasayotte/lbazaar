import { Add, Delete, Edit } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Grid, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"

const CourseCategory = () => {

    const sortOptions = [
        { name: 'Name A-Z', value: 'name:asc' },
        { name: 'Name Z-A', value: 'name:desc' },
        { name: 'Date - Oldest', value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography
                    variant="h4"
                    children="Categories"
                />
                <Button
                    children="Create Category"
                    variant="contained"
                    startIcon={
                        <Add/>
                    }
                />
            </Stack>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Input
                                label="Keyword"
                                placeholder="Search for name"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Input
                                label="Sort"
                                select
                                InputLabelProps={{
                                    shrink: true
                                }}
                            >
                                {displaySelectOptions(sortOptions, 'value')}
                            </Input>
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <Button
                                children="Filter"
                                variant="contained"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell width="80%" children="Name" />
                            <TableCell children="Actions" align="center" />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell children="Lorem Ipsum" />
                            <TableCell>
                                <Stack spacing={1} direction="row" justifyContent="center">
                                    <IconButton size="small" title="Edit">
                                        <Edit fontSize="inherit" />
                                    </IconButton>
                                    <IconButton size="small" title="Delete">
                                        <Delete color="error" fontSize="inherit" />
                                    </IconButton>
                                </Stack>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default CourseCategory
