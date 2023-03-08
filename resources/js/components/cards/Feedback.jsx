import { Card, IconButton, CardContent, Typography, Box } from "@mui/material"
import EditIcon from '@mui/icons-material/Edit';
import { getRoute } from "../../helpers/routes.helper"
import { Link } from "@inertiajs/inertia-react"

const Feedback = ({ auth, feedback, showUser = true }) => {

    // const editButton = (
    //     auth.user && auth.user.id && auth.user.id == feedback.user.id && (
    //         <Link title="Edit Feedback" href={getRoute('course.feedback.index', {id : feedback.course_id}, {returnUrl : getRoute('course.details', {id : feedback.course_id})})}>
    //             <IconButton size="small" color="white">
    //                 <EditIcon fontSize="inherit" color="inherit" />
    //             </IconButton>
    //         </Link>
    //     )
    // )

    return (
        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between">
                    <Box>
                        {
                            showUser &&
                            <Typography inline="true" align="left" variant="subtitle1" children={feedback.user.fullname} />
                        }
                        <Box display="flex" alignItems="center">
                            <Typography color="primary" variant="caption" children={`${feedback.rating}/100`} sx={{ mr: 1 }} />
                            <Typography variant="caption" color="GrayText" children={`Posted on ${feedback.created_at}`} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                        <span dangerouslySetInnerHTML={{ __html: feedback.comments }} />
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default Feedback
