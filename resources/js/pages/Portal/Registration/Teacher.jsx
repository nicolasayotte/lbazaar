import { useForm, usePage } from "@inertiajs/inertia-react"
import { Add, Delete } from "@mui/icons-material"
import { Box, Button, Card, CardContent, Container, Divider, Grid, IconButton, Paper, Stack, Typography } from "@mui/material"
import { grey } from "@mui/material/colors"
import Input from "../../../components/forms/Input"
import { handleOnChange } from "../../../helpers/form.helper"

const Teacher = () => {

    const { translatables } = usePage().props

    const educationBlueprint = {
        school: '',
        degree: '',
        start_date: '',
        end_date: ''
    }

    const workBlueprint = {
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: ''
    }

    const { data, setData, errors, post } = useForm('TeacherRegistrationForm', {
        first_name: '',
        last_name: '',
        email: '',
        university: '',
        specialty: '',
        about: '',
        education: [],
        work: []
    })

    const handleOnItemAdd = (type = '', bluePrint = null) => {
        const items = data[type];

        items.push(bluePrint)

        setData(data => ({
            ...data,
            [type]: items
        }))
    }

    const handleOnItemDelete = (index, type = '') => {

        let items = data[type]

        items = items.filter((item, itemIndex) => itemIndex != index )

        setData(data => ({
            ...data,
            [type]: items
        }))
    }

    const handleOnItemChange = (e, index, name, type) => {

        const items = data[type]

        items[index][name] = e.target.value

        setData(data => ({
            ...data,
            [type]: items
        }))
    }

    const EmptyBox = ({ message = '', handleOnClick = null }) => {

        return (
            <Box
                sx={{
                    border: `2px dashed ${grey['400']}`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    p: 8,
                    cursor: 'pointer'
                }}
                children={message || translatables.texts.no_records_found}
                onClick={handleOnClick}
            />
        )
    }

    const basicInformationForm = () => (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Typography variant="h6" children={translatables.texts.basic_information} />
            </Grid>
            <Grid item xs={12} md={6}>
                <Input
                    label={translatables.texts.first_name}
                    name="first_name"
                    value={data.first_name}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <Input
                    label={translatables.texts.last_name}
                    name="last_name"
                    value={data.last_name}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Grid>
            <Grid item xs={12}>
                <Input
                    type="email"
                    label={translatables.texts.email}
                    name="email"
                    value={data.email}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Grid>
            <Grid item xs={12}>
                <Input
                    label={translatables.user.university}
                    name="university"
                    value={data.university}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Grid>
            <Grid item xs={12}>
                <Input
                    label={translatables.user.specialty}
                    name="specialty"
                    value={data.specialty}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Grid>
            <Grid item xs={12}>
                <Input
                    multiline
                    rows={10}
                    label={translatables.user.about}
                    name="about"
                    value={data.about}
                    onChange={e => handleOnChange(e, setData)}
                    errors={errors}
                />
            </Grid>
        </Grid>
    )

    const educationForm = () => {

        const education = () => data.education && data.education.length > 0 && data.education.map((education, index) => (
            <Grid key={index} item xs={12}>
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} textAlign="right">
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                <Typography children={translatables.texts.education} />
                                <IconButton
                                    size="small"
                                    title={translatables.texts.delete}
                                    onClick={() => handleOnItemDelete(index, 'education')}
                                >
                                    <Delete fontSize="inherit" color="error" />
                                </IconButton>
                            </Stack>
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                label={translatables.education.school}
                                name={`education.${index}.school`}
                                value={data.education[index].school}
                                onChange={e => handleOnItemChange(e, index, 'school', 'education')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label={translatables.education.degree}
                                name={`education.${index}.degree`}
                                value={data.education[index].degree}
                                onChange={e => handleOnItemChange(e, index, 'degree', 'education')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Input
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                label={translatables.class_schedule.start_date}
                                name={`education.${index}.start_date`}
                                value={data.education[index].start_date}
                                onChange={e => handleOnItemChange(e, index, 'start_date', 'education')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Input
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                label={translatables.class_schedule.end_date}
                                name={`education.${index}.end_date`}
                                value={data.education[index].end_date}
                                onChange={e => handleOnItemChange(e, index, 'end_date', 'education')}
                                errors={errors}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        ))

        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="h6" children={translatables.education.background} />
                        <Button
                            variant="outlined"
                            children={translatables.texts.add_item}
                            onClick={() => handleOnItemAdd('education', educationBlueprint)}
                            startIcon={<Add />}
                        />
                    </Stack>
                </Grid>
                {
                    data.education && data.education.length <= 0 &&
                    <Grid item xs={12}>
                        <EmptyBox handleOnClick={() => handleOnItemAdd('education', educationBlueprint)} />
                    </Grid>
                }
                { education() }
            </Grid>
        )
    }

    const workExperienceForm = () => {

        const work = () => data.work && data.work.length > 0 && data.work.map((work, index) => (
            <Grid key={index} item xs={12}>
                <Paper elevation={3} sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} textAlign="right">
                            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                                <Typography children={translatables.texts.work} />
                                <IconButton
                                    size="small"
                                    title={translatables.texts.delete}
                                    onClick={() => handleOnItemDelete(index, 'work')}
                                >
                                    <Delete fontSize="inherit" color="error" />
                                </IconButton>
                            </Stack>
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                label={translatables.work.company}
                                name={`work.${index}.company`}
                                value={data.work[index].company}
                                onChange={e => handleOnItemChange(e, index, 'company', 'work')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Input
                                label={translatables.work.position}
                                name={`work.${index}.position`}
                                value={data.work[index].position}
                                onChange={e => handleOnItemChange(e, index, 'position', 'work')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Input
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                label={translatables.class_schedule.start_date}
                                name={`work.${index}.start_date`}
                                value={data.work[index].start_date}
                                onChange={e => handleOnItemChange(e, index, 'start_date', 'work')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Input
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                label={translatables.class_schedule.end_date}
                                name={`work.${index}.end_date`}
                                value={data.work[index].end_date}
                                onChange={e => handleOnItemChange(e, index, 'end_date', 'work')}
                                errors={errors}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Input
                                multiline
                                rows={4}
                                label={translatables.texts.description}
                                name={`work.${index}.description`}
                                value={data.work[index].description}
                                onChange={e => handleOnItemChange(e, index, 'description', 'work')}
                                errors={errors}
                            />
                        </Grid>
                    </Grid>
                </Paper>
            </Grid>
        ))

        return (
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="h6" children={translatables.work.history} />
                        <Button
                            variant="outlined"
                            children={translatables.texts.add_item}
                            onClick={() => handleOnItemAdd('work', workBlueprint)}
                            startIcon={<Add />}
                        />
                    </Stack>
                </Grid>
                {
                    data.work && data.work.length <= 0 &&
                    <Grid item xs={12}>
                        <EmptyBox handleOnClick={() => handleOnItemAdd('work', workBlueprint)} />
                    </Grid>
                }
                { work() }
            </Grid>
        )
    }

    return (
        <Box py={5}>
            <Container>
                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} md={8}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                            <Typography variant="h5" children={translatables.texts.sign_up_teacher} />
                            <Button
                                variant="contained"
                                size="large"
                                children={translatables.texts.submit}
                            />
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardContent>
                                { basicInformationForm() }
                                <Divider sx={{ my: 3 }} />
                                { educationForm() }
                                <Divider sx={{ my: 3 }} />
                                { workExperienceForm() }
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={8} textAlign="right">
                        <Button
                            variant="contained"
                            size="large"
                            children={translatables.texts.submit}
                        />
                    </Grid>
                </Grid>
            </Container>
        </Box>
    )
}

export default Teacher
