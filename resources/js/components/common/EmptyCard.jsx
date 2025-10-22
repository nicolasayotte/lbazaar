import { usePage } from "@inertiajs/inertia-react"
import { Card, CardContent, Typography } from "@mui/material"

const EmptyCard = ({ message = '', condensed = false }) => {

    const { translatables } = usePage().props

    return (
        <Card sx={{width: '100%'}}>
            <CardContent>
                <Typography
                    variant="h6"
                    textAlign="center"
                    children={ message || translatables.texts.no_records_found }
                    sx={{ my: condensed ? 2 : 5 }}
                />
            </CardContent>
        </Card>
    )
}

export default EmptyCard
