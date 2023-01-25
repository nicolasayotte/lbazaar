
import {Card, CardContent, Button, Typography, Box} from "@mui/material"

const Course = ({ user }) => {
    return (
        <Card sx={{ minWidth: 275, mb: 2, position: 'relative' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="h6" children={user.fullname} />
                        <Typography variant="caption" color="GrayText" children={`Member since ${user.created_at}`} />
                    </Box>
                    <Button
                        size="small"
                        variant="contained"
                        children="View Profile"
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

export default Course
