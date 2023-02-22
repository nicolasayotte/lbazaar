import { usePage } from "@inertiajs/inertia-react"
import { CheckCircle, RadioButtonCheckedOutlined, RadioButtonUnchecked, TaskAlt } from "@mui/icons-material"
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material"
import EmptyCard from "../../../../components/common/EmptyCard"

const StudentsTable = ({ data, exams, course }) => {

    const { translatables } = usePage().props

    const displayCourseExams = () => exams && exams.length > 0 && exams.map((exam, index) => (
        <TableCell key={index} align="center" children={exam.name} />
    ))

    const Students = () => data && data.length > 0 && data.map((student, index) => {

        const displayUserExams = () => {
            const { exams: userExams } = student.user

            return exams && exams.length > 0 && exams.map((exam, index) => {
                const hasUserExam = userExams.find(userExam => userExam.exam_id === exam.id) !== undefined

                return (
                    <TableCell align="center" key={index}>
                        {
                            hasUserExam
                            ? <TaskAlt color="success" />
                            : <RadioButtonUnchecked color="disabled" />
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
                        ? <TaskAlt color="success" />
                        : <RadioButtonUnchecked color="disabled" />
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
                        <TableCell align="center" children={'Feedback'} />
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
