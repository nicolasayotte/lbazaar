import { Box, Button, Card, CardContent, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"

const Index = () => {

    const testRows = (size) => {
        const rows = []

        for (let i = 0; i < size; i++) {
            rows.push({
                id: i + 1,
                name: 'John Smith',
                subject: 'Lorem Ipsum Dolor Sit Amet',
                date: (new Date()).toDateString()
            })
        }

        return rows
    }

    const sortItems = [
        { name: 'Name A-Z' },
        { name: 'Name Z-A' },
        { name: 'Date ASC' },
        { name: 'Date DESC' }
    ]

    return (
        <Box>
            <Typography
                variant="h4"
                children="Inquiries"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Input
                                label="Keyword"
                                placeholder="Search for keyword"
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Input
                                label="Sort By"
                                select
                                children={displaySelectOptions(sortItems, 'name', 'name')}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
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
                            <TableCell children="Subject"/>
                            <TableCell children="Date"/>
                            <TableCell children="Actions"/>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {testRows(10).map((row, index) => (
                            <TableRow key={index}>
                                <TableCell children={row.name}/>
                                <TableCell children={row.subject}/>
                                <TableCell children={row.date}/>
                                <TableCell>
                                    <Button
                                        variant="text"
                                        size="small"
                                        children="View"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    )
}

export default Index
