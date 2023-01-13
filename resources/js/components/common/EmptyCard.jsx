import { Card, CardContent, Typography } from "@mui/material"

const EmptyCard = () => {
    return (
        <Card sx={{width: '100%'}}>
            <CardContent>
                <Typography
                    variant="h6"
                    textAlign="center"
                    children="No records found"
                    sx={{ my: 5 }}
                />
            </CardContent>
        </Card>
    )
}

export default EmptyCard
