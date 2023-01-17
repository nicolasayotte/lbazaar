import {Grid, Divider, Card, IconButton, CardContent, Typography} from "@mui/material"
import HtmlParser from "../common/HtmlParser";
import EditIcon from '@mui/icons-material/Edit';
import { getRoute } from "../../helpers/routes.helper"
import { Link } from "@inertiajs/inertia-react"

const Feedback = (props) => {

    const displayButtonFeedback = () => {
        if (props.auth != null && props.auth.user.id == props.feedback.user.id) {
            return (
                <Link title="Edit Feedback" href={getRoute('course.feedback.index', {id : props.feedback.course_id}, {returnUrl : getRoute('course.details', {id : props.feedback.course_id})})}>
                    <IconButton color="white">
                        <EditIcon fontSize="small" color="inherit" />
                    </IconButton>
                </Link>
            )
        }
    }

    return (
        <Card sx={{ minWidth: 275, m: 2, position: 'relative' }}>
            <CardContent>
                <Grid container justifyContent="space-between">
                    <Typography inline="true" align="left" variant="subtitle1">
                        {`${props.feedback.user.fullname}`}   <Typography inline="true" align="left" variant="caption">{ props.feedback.created_at}  {displayButtonFeedback()}</Typography>
                    </Typography>

                    <Typography inline="true" align="right" variant="subtitle1">
                        {`rating : ${props.feedback.rating} / 100`}
                    </Typography>
                </Grid>
                <Divider />
                <Typography variant="caption" gutterBottom>
                    <HtmlParser html={props.feedback.comments} />
                </Typography>
            </CardContent>
        </Card>
    );
}

export default Feedback
