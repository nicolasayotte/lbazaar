import { Box, Breadcrumbs, Button, Card, CardContent, CardMedia, Container, Divider, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import TextEditorInput from "../../../components/forms/TextEditorInput"
import placeholderImg from "../../../../img/placeholder.png"
import { Stack } from "@mui/system"
import FileInput from "../../../components/forms/CustomFileInput"
import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import routes from "../../../helpers/routes.helper"
import { displaySelectOptions, handleOnChange } from "../../../helpers/form.helper"

const Create = () => {

    const { courseApplication, translatables, categories } = usePage().props

    const { data, setData, post, errors } = useForm('CreateClassForm', {
        ...courseApplication,
        image_thumbnail: ''
    })

    const price = data && data.price || 'Free'

    return (
        <Container sx={{ mt: 4 }}>
            <Grid container spacing={2}>
                <Grid item container xs={12} alignItems="center" spacing={2}>
                    <Grid item xs={12} md={7}>
                        <Typography variant="h4" children={translatables.title.class.create} />
                        <Breadcrumbs>
                            <Link href={routes["mypage.course.applications.index"]} children={translatables.title.class.applications.index} />
                            <Typography color="text.primary" children={translatables.title.class.create} />
                        </Breadcrumbs>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Stack direction={{ xs: 'column-reverse', md: 'row' }} spacing={2} justifyContent="end">
                            <Link href={routes["mypage.course.applications.index"]}>
                                <Button
                                    children={translatables.texts.cancel}
                                />
                            </Link>
                            <Button
                                variant="contained"
                                children={translatables.texts.submit}
                            />
                        </Stack>
                    </Grid>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom children={translatables.texts.class_information} />
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
                                       <FileInput
                                            name="image_thumbnail"
                                            value={data.image_thumbnail}
                                       />
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Input
                                        placeholder="Title"
                                        name="title"
                                        value={data.title}
                                        onChange={e => handleOnChange(e, setData)}
                                        errors={errors}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextEditorInput
                                        style={{ height: '200px', minHeight: '200px' }}
                                        name="description"
                                        value={data.description}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Input
                                        select
                                        placeholder="Category"
                                        name="course_category_id"
                                        value={data.course_category_id}
                                        onChange={e => handleOnChange(e, setData)}
                                        children={displaySelectOptions(categories)}
                                        errors={errors}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <TableContainer component={Paper} sx={{ mb: 2 }}>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell children="Type" />
                                    <TableCell align="right" children={data && data.course_type && data.course_type.name} />
                                </TableRow>
                                {
                                    data.price > 0 &&
                                    <TableRow>
                                        <TableCell children="Price" />
                                        <TableCell align="right" children={price} />
                                    </TableRow>
                                }
                                <TableRow>
                                    <TableCell children="Max Seats" />
                                    <TableCell align="right" children={data && data.max_participant} />
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
