import { usePage } from "@inertiajs/inertia-react"
import { Block, Check, Search } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import UserTable from "./components/UserTable"

const Index = () => {

    const { users } = usePage().props
    console.log(users)

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
            <UserTable data={users.data} />
        </Box>
    )
}

export default Index
