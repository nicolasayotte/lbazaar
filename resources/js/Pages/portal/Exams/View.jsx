import { useForm, usePage } from "@inertiajs/inertia-react"
import { Button, Container, Divider, Grid, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import { useState } from "react"
import { getRoute } from "../../../helpers/routes.helper"

const View = () => {

    const { exam, translatables, schedule_id, course_id } = usePage().props

    const { items } = exam

    const [ started, setStarted ] = useState(false)

    const [ currentItem, setCurrentItem ] = useState(0)

    const [ currentProgress, setCurrentProgress ] = useState(0)

    const [ selectedChoice, setSelectedChoice ] = useState(null)

    const { data, setData, post } = useForm({
        answers: []
    })

    const handleOnSelectChoice = id => {
        setSelectedChoice(id)
    }

    const handleOnNextQuestion = () => {

        let { answers } = data

        answers.push({
            exam_item_id: items[currentItem].id,
            exam_item_choice_id: selectedChoice
        })

        setData('answers', answers)

        setSelectedChoice(null)
        setCurrentItem(currentItem + 1)

        setCurrentProgress(Math.round(((currentItem + 1) / items.length) * 100))
    }

    const handleOnSubmit = e => {
        e.preventDefault()

        setCurrentProgress(100)

        let { answers } = data

        answers.push({
            exam_item_id: items[currentItem].id,
            exam_item_choice_id: selectedChoice
        })

        setData('answers', answers)

        post(getRoute('course.attend.exams.submit', { course_id, schedule_id, id: exam.id }))
    }

    const SubmitButton = () => {

        if (((currentItem + 1) >= items.length)) {
            return (
                <Button
                    type="submit"
                    variant="contained"
                    children={translatables.texts.submit}
                    disabled={selectedChoice === null}
                    onClick={handleOnSubmit}
                />
            )
        }

        return (
            <Button
                variant="contained"
                children={translatables.texts.next_question}
                disabled={selectedChoice === null}
                onClick={handleOnNextQuestion}
            />
        )
    }

    const ExamItem = () => {

        const choiceItemGridSize = {
            2: 6,
            3: 4,
            4: 6
        }

        return (
            <Grid item xs={12} md={8}>
                <Grid container alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={11}>
                        <LinearProgress variant="determinate" value={currentProgress} />
                    </Grid>
                    <Grid item xs={1}>
                        <Typography textAlign="right" children={`${currentProgress}%`} />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, minHeight: '200px' }}>
                            <Typography variant="h6" sx={{ mb: 2 }} children={`${items[currentItem].points}pt${items[currentItem].points > 1 ? 's' : ''}`}/>
                            <Typography children={items[currentItem].question} />
                        </Paper>
                    </Grid>
                    {
                        items[currentItem].choices.map((choice, index) => (
                            <Grid key={index} item xs={12} md={choiceItemGridSize[items[currentItem].choices.length]}>
                                <Paper>
                                    <Button
                                        size="large"
                                        children={choice.value}
                                        fullWidth
                                        variant={selectedChoice === choice.id ? 'contained' : 'text'}
                                        onClick={() => handleOnSelectChoice(choice.id)}
                                    />
                                </Paper>
                            </Grid>
                        ))
                    }
                    <Grid item xs={12} textAlign="right" sx={{ mt: 2 }}>
                        <SubmitButton />
                    </Grid>
                </Grid>
            </Grid>
        )
    }

    const ExamOverview = () => (
        <Grid item xs={12} md={5}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell colSpan={2} align="center">
                                <Typography variant="h6" children={exam.name} />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell children={translatables.texts.total_items} />
                            <TableCell align="right" children={exam.items.length} />
                        </TableRow>
                        <TableRow>
                            <TableCell children={translatables.texts.total_points} />
                            <TableCell align="right" children={exam.total_points} />
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={2}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    children={translatables.texts.take_exam}
                                    onClick={() => setStarted(true)}
                                />
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Grid>
    )

    return (
        <>
            <Container>
                <form onSubmit={handleOnSubmit}>
                    <Grid container spacing={2} alignItems="center" justifyContent="center" minHeight="100vh">
                        { !started ? <ExamOverview /> : <ExamItem />}
                    </Grid>
                </form>
            </Container>
        </>
    )
}

export default View
