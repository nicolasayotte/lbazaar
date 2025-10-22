import { Link, usePage } from "@inertiajs/inertia-react"
import { RadioButtonUnchecked, Search, TaskAlt, HighlightOff } from "@mui/icons-material"
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"
import { getRoute } from "../../../../helpers/routes.helper"

const StudentsTable = ({ data, exams, course, schedule, handleOnClear, handleOnView }) => {

    const { translatables } = usePage().props

    const displayCourseExams = () => exams && exams.length > 0 && exams.map((exam, index) => (
        <TableCell key={index} align="center" children={exam.name} />
    ))

    const Students = () => data && data.length > 0 && data.map((student, index) => {

        const displayUserExams = () => {
            const { exams: userExams } = student.user

            return exams && exams.length > 0 && exams.map((exam, index) => {
                const userExam = userExams.find(userExam => userExam.exam_id == exam.id && userExam.course_schedule_id == schedule.id) || null
                const isPassedExam = userExam ? userExam.is_passed : 0

                return (
                    <TableCell align="center" key={index}>
                        {
                            userExam !== null
                            ? (
                                <Tooltip title="Clear">
                                    { isPassedExam ?
                                        <TaskAlt
                                            fontSize="small"
                                            color="success"
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleOnClear(userExam.id)}
                                        /> :
                                        <HighlightOff
                                            fontSize="small"
                                            sx={{ cursor: 'pointer', color:'#ef5350' }}
                                            onClick={() => handleOnClear(userExam.id)}
                                        />
                                    }
                                </Tooltip>
                            )
                            : <RadioButtonUnchecked fontSize="small" color="disabled" />
                        }
                    </TableCell>
                )
            })
        }

        const displayUserFeedback = () => {
            const { feedbacks } = student.user

            const hasCourseFeedback = feedbacks.find(feedback => feedback.course_id === course.id)

            return (
                <TableCell align="center">
                    {
                        hasCourseFeedback
                        ? <TaskAlt fontSize="small" color="success" />
                        : <RadioButtonUnchecked fontSize="small" color="disabled" />
                    }
                </TableCell>
            )
        }

        return (
            <TableRow key={index}>
                <TableCell children={student.fullname} />
                <TableCell children={student.email} />
                <TableCell children={student.created_at} />
                { displayUserExams() }
                { displayUserFeedback() }
                <TableCell align="center">
                    {/* <Link href={getRoute('schedules.student.view', { id: schedule.id, student_id: student.id })}>
                        <IconButton title={translatables.texts.view}>
                            <Search fontSize="small" />
                        </IconButton>
                    </Link> */}
                    <Tooltip title={translatables.texts.view}>
                        <IconButton onClick={() => handleOnView(student.user)}>
                            <Search fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>
        )
    })

    if (data.length <= 0) {
        return <EmptyCard />
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell children={translatables.texts.name} />
                        <TableCell children={translatables.texts.email} />
                        <TableCell children={translatables.texts.date} />
                        { displayCourseExams() }
                        <TableCell align="center" children={translatables.title.feedbacks} />
                        <TableCell align="center" children={translatables.texts.actions} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    <Students />
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default StudentsTable
