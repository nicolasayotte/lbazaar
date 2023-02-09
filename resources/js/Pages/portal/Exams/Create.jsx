import { Link, useForm, usePage } from "@inertiajs/inertia-react"
import { Add, Delete } from "@mui/icons-material"
import { Box, Breadcrumbs, Button, Card, CardContent, Chip, Container, Divider, Grid, IconButton, InputBase, Paper, Radio, Stack, Tooltip, Typography } from "@mui/material"
import Input from "../../../components/forms/Input"
import routes, { getRoute } from "../../../helpers/routes.helper"
import { handleOnChange } from "../../../helpers/form.helper"
import { useDispatch } from "react-redux"
import { actions } from "../../../store/slices/ToasterSlice"
import ErrorText from "../../../components/common/ErrorText"
import { red } from "@mui/material/colors"

const Create = () => {

    const { translatables, courseId } = usePage().props

    const dispatch = useDispatch()

    const choiceBlueprint = {
        value: ''
    }

    const itemBluePrint = {
        question: '',
        points: 1,
        correct_index: 0,
        choices: [
            choiceBlueprint
        ]
    }

    const { data, setData, post, errors } = useForm(`ExamForm:${courseId}`, {
        points: 1,
        name: '',
        items: [
            itemBluePrint
        ]
    })

    const handleOnAddChoice = itemIndex => {
        const { items } = data

        if (items[itemIndex].choices.length > 3) {
            return
        }

        items[itemIndex].choices = [
            ...items[itemIndex].choices,
            choiceBlueprint
        ]

        setData(data => ({
            ...data,
            items
        }))
    }

    const handleOnChoiceChange = (e, itemIndex, choiceIndex) => {
        const { items } = data

        items[itemIndex].choices[choiceIndex] = {
            ...items[itemIndex].choices[choiceIndex],
            [e.target.name]: e.target.value
        }

        setData(data => ({
            ...data,
            items
        }))
    }

    const handleOnItemChange = (e, itemIndex) => {
        const { items } = data

        items[itemIndex] = {
            ...items[itemIndex],
            [e.target.name]: e.target.value
        }

        if (e.target.name == 'points') {
            let totalPoints = 0

            items.map(item => totalPoints += parseInt(item.points || 0))

            setData(data => ({
                ...data,
                points: totalPoints
            }))
        }

        setData(data => ({
            ...data,
            items
        }))
    }

    const handleOnRadioChange = (e, itemIndex) => {
        const { items } = data

        items[itemIndex] = {
            ...items[itemIndex],
            correct_index: e.target.value
        }

        setData(data => ({
            ...data,
            items
        }))
    }

    const handleOnAddItem = () => {
        setData(data => ({
            ...data,
            points: data.points += 1,
            items: [
                ...data.items,
                itemBluePrint
            ]
        }))
    }

    const handleOnDeleteChoice = (itemIndex, choiceIndex) => {
        const { items } = data

        items[itemIndex].choices = items[itemIndex].choices.filter((choice, index) => index != choiceIndex)

        if (choiceIndex == items[itemIndex].correct_index) {
            items[itemIndex].correct_index = 0
        }

        setData(data => ({
            ...data,
            items
        }))
    }

    const handleOnDeleteItem = itemIndex => {
        let { items } = data

        setData(data => ({
            ...data,
            points: data.points - parseInt(items[itemIndex].points || 0)
        }))

        items = items.filter((item, index) => index != itemIndex)

        setData(data => ({
            ...data,
            items
        }))
    }

    const handleSubmit = e => {
        e.preventDefault()

        post(getRoute('exams.store', { id: courseId }), {
            onSuccess: () => dispatch(actions.success({
                message: translatables.success.exams.create
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    const displayChoices = (item, itemIndex) => item.choices.map((choice, index) => {

        const hasError = errors && errors[`items.${itemIndex}.choices.${index}.value`] ? true : false

        return (
            <Grid key={index} item xs={12}>
                <Paper
                    elevation={3}
                    sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid transparent',
                        borderColor: hasError ? red['500'] : 'transparent'
                    }}
                >
                    <InputBase
                        sx={{ flexGrow: 1 }}
                        placeholder={`${translatables.texts.choice} #${index + 1}`}
                        name="value"
                        value={data.items[itemIndex].choices[index].value}
                        onChange={e => handleOnChoiceChange(e, itemIndex, index)}
                    />
                    <Tooltip title={`${translatables.texts.correct_value}?`}>
                        <Radio
                            name={`${itemIndex}.correct_index`}
                            value={index}
                            checked={data.items[itemIndex].correct_index == index}
                            onChange={e => handleOnRadioChange(e, itemIndex)}
                        />
                    </Tooltip>
                    <Tooltip title={translatables.texts.delete}>
                        <IconButton
                            color="error"
                            onClick={() => handleOnDeleteChoice(itemIndex, index)}
                        >
                            <Delete />
                        </IconButton>
                    </Tooltip>
                </Paper>
                { hasError && <ErrorText error={errors[`items.${itemIndex}.choices.${index}.value`]} /> }
            </Grid>
        )
    })

    const displayItems = data.items.map((item, index) => (
        <Card sx={{ mb: 2 }} key={index}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" children={`Item #${index + 1}`} />
                    <Tooltip title={translatables.texts.delete}>
                        <IconButton
                            color="error"
                            onClick={() => handleOnDeleteItem(index)}
                        >
                            <Delete/>
                        </IconButton>
                    </Tooltip>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={2}>
                        <Input
                            type="number"
                            placeholder={translatables.texts.points}
                            label={translatables.texts.points}
                            name="points"
                            value={data.items[index].points}
                            onChange={e => handleOnItemChange(e, index)}
                            InputProps={{
                                inputProps: {
                                    min: 1,
                                    max: 100
                                }
                            }}
                            custom_name={`items.${index}.points`}
                            errors={errors}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Input
                            multiline
                            rows={4}
                            placeholder={translatables.texts.question}
                            name="question"
                            value={data.items[index].question}
                            onChange={e => handleOnItemChange(e, index)}
                            custom_name={`items.${index}.question`}
                            errors={errors}
                        />
                    </Grid>
                    {
                        errors && errors[`items.${index}.choices`] &&
                        <Grid item xs={12}>
                            <ErrorText error={errors[`items.${index}.choices`]} />
                        </Grid>
                    }
                    { displayChoices(item, index) }
                    {
                        item.choices.length <= 3 &&
                        <Grid item xs={12} textAlign="right" >
                            <Tooltip title={translatables.texts.add_choice}>
                                <Button
                                    variant="contained"
                                    children={translatables.texts.add_choice}
                                    startIcon={<Add />}
                                    onClick={() => handleOnAddChoice(index)}
                                />
                            </Tooltip>
                        </Grid>
                    }
                </Grid>
            </CardContent>
        </Card>
    ))

    return (
        <form>
            <Container sx={{ pt: 4, minHeight: '100vh' }}>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} md={9}>
                        <Typography variant="h5" children={translatables.texts.create_exam} />
                        <Breadcrumbs>
                            <Link href={routes["mypage.course.manage_class.index"]} children={translatables.title.class.manage.index} />
                            <Link href={getRoute('mypage.course.manage_class.exams', { id: courseId })} children={translatables.title.class.manage.view} />
                            <Typography color="text.primary" children={translatables.texts.create_exam} />
                        </Breadcrumbs>
                    </Grid>
                    <Grid item xs={12} md={3} textAlign="right">
                        <Grid container spacing={2} alignItems="flex-end">
                            <Grid item xs={6} md={6}>
                                <Link href={getRoute('mypage.course.manage_class.exams', { id: courseId })}>
                                    <Button
                                        variant="outlined"
                                        children={translatables.texts.cancel}
                                        size="large"
                                        fullWidth
                                    />
                                </Link>
                            </Grid>
                            <Grid item xs={6} md={6}>
                                <Button
                                    variant="contained"
                                    children={translatables.texts.submit}
                                    size="large"
                                    fullWidth
                                    type="submit"
                                    onClick={handleSubmit}
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Box mb={2}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            border: `1px solid ${ errors && errors.name ? red['500'] : 'transparent' }`
                        }}
                    >
                        <InputBase
                            placeholder={translatables.texts.exam_name}
                            name="name"
                            value={data.name}
                            onChange={e => handleOnChange(e, setData)}
                            sx={{
                                flexGrow: 1,
                                width: { xs: '100%', md: 'auto' },
                                mb: { xs: 2, md: 0 }
                            }}
                        />
                        <Chip
                            color="primary"
                            variant="outlined"
                            label={`${translatables.texts.total_items}: ${data.items.length}`}
                            sx={{ mr: 1 }}
                        />
                        <Chip
                            color="primary"
                            label={`${translatables.texts.total_points}: ${data.points}`}
                        />
                    </Paper>
                    { errors && errors.name && <ErrorText error={errors.name} /> }
                </Box>
                { displayItems }
                <Box textAlign="center">
                    <Tooltip title={translatables.texts.add_item}>
                        <Button
                            variant="contained"
                            children={translatables.texts.add_item}
                            onClick={handleOnAddItem}
                            startIcon={<Add />}
                        />
                    </Tooltip>
                </Box>
            </Container>
        </form>
    )
}

export default Create
