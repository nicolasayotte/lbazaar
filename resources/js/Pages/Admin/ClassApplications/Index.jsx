import { Box, Button, Card, CardContent, Grid, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import { displaySelectOptions } from "../../../helpers/form.helper"
import ClassApplicationTable from "./components/ClassApplicationTable"

const Index = () => {

    const sortOptions = [
        { name: 'Title A-Z', value: 'title:asc' },
        { name: 'Title Z-A', value: 'title:desc' },
        { name: 'Price - Low to High', value: 'price:asc' },
        { name: 'Price - High to Low', value: 'price:desc' },
        { name: 'Date - Oldest', value: 'created_at:asc' },
        { name: 'Date - Newest', value: 'created_at:desc' }
    ]

    const paymentOptions = [
        { name: 'Free', value: 'free' },
        { name: 'Paid', value: 'paid' }
    ]

    return (
        <Box>
            <Typography
                variant="h4"
                children="Class Applications"
                gutterBottom
            />
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={12}>
                            <Input
                                label="Keyword"
                                placeholder="Search for title or teacher"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                select
                                label="Type"
                                InputLabelProps={{
                                    shrink: true
                                }}
                            >
                                <option value="">All</option>
                            </Input>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                select
                                label="Format"
                                InputLabelProps={{
                                    shrink: true
                                }}
                            >
                                <option value="">All</option>
                            </Input>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                select
                                label="Category"
                                InputLabelProps={{
                                    shrink: true
                                }}
                            >
                                <option value="">All</option>
                            </Input>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                select
                                label="Payment"
                                InputLabelProps={{
                                    shrink: true
                                }}
                            >
                                <option value="">All</option>
                                {displaySelectOptions(paymentOptions, 'value')}
                            </Input>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Input
                                select
                                label="Sort"
                                InputLabelProps={{
                                    shrink: true
                                }}
                            >
                                {displaySelectOptions(sortOptions, 'value')}
                            </Input>
                        </Grid>
                        <Grid item xs={12} md={2} textAlign="right">
                            <Button
                                children="Filter"
                                variant="contained"
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <ClassApplicationTable />
        </Box>
    )
}

export default Index
