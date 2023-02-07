import { Box, Button, Card, CardContent, CardMedia, Container, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import TextEditorInput from "../../../components/forms/TextEditorInput"
import placeholderImg from "../../../../img/placeholder.png"
import { Stack } from "@mui/system"
import FileInput from "../../../components/forms/FileInput"
import { AddCircle } from "@mui/icons-material"
import { useState } from "react"

const Create = () => {

    const [isLive, setIsLive] = useState(true)

    const handleOnClassFormatChange = value => {
        setIsLive(value === 'live')
    }

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
                                    <Input placeholder="Title" />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextEditorInput
                                        style={{ height: '200px', minHeight: '200px' }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Input placeholder="Title" />
                                </Grid>
                                <Grid item xs={12}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                            <Button
                                                variant={isLive ? 'contained' : 'outlined'}
                                                fullWidth
                                                children="Live"
                                                onClick={() => handleOnClassFormatChange('live')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                            <Button
                                                variant={!isLive ? 'contained' : 'outlined'}
                                                fullWidth
                                                children="On-Demand"
                                                onClick={() =>handleOnClassFormatChange('on_demand')}
                                            />
                                        </Grid>
                                    </Grid>
                                    <Divider sx={{ mt: 2 }} />
                                </Grid>
                                <Grid item xs={12} display={isLive ? 'grid' : 'none'}>
                                    <Input placeholder="Zoom Link" />
                                </Grid>
                                <Grid item xs={12} display={!isLive ? 'grid' : 'none'}>
                                    <Input placeholder="Video Link" />
                                    <Typography children="or" color="GrayText" textAlign="center" my={0.5} />
                                    <FileInput/>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
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
