
import {Card, CardContent, Button, Typography, Tooltip, Grid} from "@mui/material"
import { Link } from "@inertiajs/inertia-react"
import { getRoute } from "../../helpers/routes.helper"
import PointsIcon from '@mui/icons-material/WorkspacePremium'
import AddPoints from '@mui/icons-material/AddCircle';

const UserPoints = ({ user, translatables }) => {
    return (
        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                    <Grid container spacing={1} alignItems={'center'}>
                        <Grid item xs={1.5}>
                            <PointsIcon sx={{ color: '#FF6B09' }} />
                        </Grid>
                        <Grid item xs={8.5}>
                            <Typography variant="h6" children={translatables.texts.points} sx={{ color: '#FF6B09' }} />
                        </Grid>
                        <Grid item xs={2}>
                            <Tooltip title={`${translatables.texts.add_points}`}>
                                <AddPoints color="primary"/>
                            </Tooltip>
                        </Grid>
                        <Grid item xs={11} ml={1} textAlign={'center'}>
                            <Typography variant="h6" children={user.user_wallet.points} color={'grey'} />
                        </Grid>
                    </Grid>
             </CardContent>
        </Card>
    );
}

export default UserPoints
