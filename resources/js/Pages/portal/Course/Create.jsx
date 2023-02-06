import { Box, Button, Card, CardContent, CardMedia, Container, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import TextEditorInput from "../../../components/forms/TextEditorInput"
import placeholderImg from "../../../../img/placeholder.png"
import { Add, Delete } from "@mui/icons-material"
import { Stack } from "@mui/system"
import FileInput from "../../../components/forms/FileInput"

const Create = () => {

    return (
        <Container sx={{ mt: 4 }}>
            <Grid container spacing={2}>
                <Grid item container xs={12} alignItems="center" spacing={2}>
                    <Grid item xs={12} md={7}>
                        <Typography variant="h4" children="Create Class" />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Stack direction={{ xs: 'column-reverse', md: 'row' }} spacing={2} justifyContent="end">
                            <Button
                                children="Cancel"
                            />
                            <Button
                                variant="outlined"
                                children="Save as Draft"
                                size="large"
                            />
                            <Button
                                variant="contained"
                                children="Save as Published"
                            />
                        </Stack>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom children="Class Information" />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <CardMedia
                                        image={placeholderImg}
                                        sx={{
                                            minHeight: '300px',
                                            backgroundSize: 'cover'
                                        }}
                                    />
                                    <Box sx={{ mt: 2 }}>
                                       <FileInput />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Input label="Title" />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextEditorInput
                                        style={{ height: '200px', minHeight: '200px' }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" children="Content" />
                                <IconButton color="error">
                                    <Delete fontSize="inherit" />
                                </IconButton>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <CardMedia
                                        image={placeholderImg}
                                        sx={{
                                            minHeight: '300px',
                                            backgroundSize: 'cover'
                                        }}
                                    />
                                    <Box sx={{ mt: 2 }}>
                                        <FileInput />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Input label="Title" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Input multiline label="Description" rows={4} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Input
                                        type="datetime-local"
                                        label="Schedule"
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Input
                                        label="Class Format"
                                        select
                                        InputLabelProps={{
                                            shrink: true
                                        }}
                                    >
                                        <option value="live">Live</option>
                                        <option value="on_demand">On-Demand</option>
                                    </Input>
                                </Grid>
                                <Grid item xs={12}>
                                    <Input label="Zoom Link" />
                                </Grid>
                                <Grid item xs={12}>
                                    <FileInput/>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                    <Box textAlign="center">
                        <Button
                            variant="contained"
                            children="Add Content"
                            startIcon={<Add />}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell colSpan={2} children="Class Application" />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Status" />
                                    <TableCell align="right" children="Approved" />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Type" />
                                    <TableCell align="right" children="General" />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Category" />
                                    <TableCell align="right" children="Sample" />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Price" />
                                    <TableCell align="right" children="10.00" />
                                </TableRow>
                                <TableRow>
                                    <TableCell children="Max Seats" />
                                    <TableCell align="right" children="10" />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Create
