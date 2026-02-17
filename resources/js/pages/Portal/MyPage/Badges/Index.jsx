
import { usePage } from "@inertiajs/inertia-react"
import { Box, Card, CardContent, Grid, Typography } from "@mui/material"
import BadgesTable from "./components/BadgesTable"
import { Verified as Badge } from "@mui/icons-material"

const Index = () => {

    const { certificates, translatables, auth, title } = usePage().props

    const hasCertificates = certificates && certificates.length > 0

    return (
        <>
            <Grid item xs={12} md={12} mb={1}>
                <Grid container spacing={2} justifyContent="space-between" alignItems="center">
                    <Grid item xs={12} md='auto'>
                        <Typography
                            variant="h5"
                            sx={{ display: { xs: 'none', md: 'inline-block' } }}
                            children={title}
                        />
                    </Grid>
                    <Grid item xs={12} md='auto'>
                        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                            <Badge />
                            <Typography
                                variant="h6"
                                sx={{ display: { xs: 'none', md: 'inline-block' } }}
                                ml={1}
                                children={` ${translatables.texts.total_badges} : ${certificates?.length || 0}`}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>

            {!hasCertificates ? (
                <Card sx={{ width: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            textAlign="center"
                            sx={{ my: 5 }}
                        >
                            {translatables.texts.no_certificates || 'No certificates yet'}
                        </Typography>
                        <Typography
                            variant="body2"
                            textAlign="center"
                            color="textSecondary"
                        >
                            {translatables.texts.complete_courses_hint || 'Complete courses with certificates enabled to earn NFT certificates'}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <BadgesTable data={certificates} />
            )}

        </>
    )
}

export default Index
