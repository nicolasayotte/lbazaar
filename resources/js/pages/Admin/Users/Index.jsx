import { Block, Check, Search } from "@mui/icons-material"
import { Box, Button, ButtonGroup, Card, CardContent, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"

const Index = () => {

    const roleOptions = [
        { name: 'Student', value: 'student' },
        { name: 'Teacher', value: 'teacher' },
        { name: 'Admin', value: 'admin' }
    ]

    const statusOptions = [
        { id: 1, name: 'Active' },
        { id: 2, name: 'Disabled' }
    ]

    const sortOptions = [
        { name: 'Name A-Z', value: 'name:asc' },
        { name: 'Name Z-A', value: 'name:desc' },
        { name: 'Date ASC',  value: 'created_at:asc' },
        { name: 'Date DESC', value: 'created_at:desc' }
    ]

    const dummyRow = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        role: 'Student',
        status: 'Active',
        date: '2022/10/10'
    }

    return (
        <Box>
            <Typography
                variant="h4"
                children="Users"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={5}>
                            <Input
                                label="Keyword"
                                placeholder="Search for name or email"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                label="Role"
                                select
                                children={displaySelectOptions(roleOptions, 'value', 'name')}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                label="Status"
                                select
                                children={displaySelectOptions(statusOptions)}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                label="Sort"
                                select
                                children={displaySelectOptions(sortOptions, 'value', 'name')}
                            />
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <Button
                                variant="contained"
                                children="Filter"
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
                            <TableCell children="Name"/>
                            <TableCell children="Email"/>
                            <TableCell children="Role" align="center"/>
                            <TableCell children="Status" align="center"/>
                            <TableCell children="Date Joined" align="center"/>
                            <TableCell children="Actions" align="center"/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell children={dummyRow.name}/>
                            <TableCell children={dummyRow.email}/>
                            <TableCell children={dummyRow.role} align="center"/>
                            <TableCell children={dummyRow.status} align="center"/>
                            <TableCell children={dummyRow.date} align="center"/>
                            <TableCell align="center">
                                <IconButton title="View">
                                    <Search />
                                </IconButton>
                                <IconButton color="success" title="Disable">
                                    <Check />
                                </IconButton>
                                <IconButton color="error" title="Disable">
                                    <Block />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default Index
