
import { usePage } from "@inertiajs/inertia-react"
import { Box, Card, CardContent, Grid, Typography } from "@mui/material"
import RewardsTable from "./components/RewardsTable"
import { Verified as Badge } from "@mui/icons-material"

const Index = () => {

    const { rewards, translatables, auth, title } = usePage().props

    const hasRewards = rewards && rewards.length > 0

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
                                children={` ${translatables.texts.total_rewards || 'Total Rewards'} : ${rewards?.length || 0}`}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>

            {!hasRewards ? (
                <Card sx={{ width: '100%' }}>
                    <CardContent>
                        <Typography
                            variant="h6"
                            textAlign="center"
                            sx={{ my: 5 }}
                        >
                            {translatables.texts.no_rewards || 'No rewards yet'}
                        </Typography>
                        <Typography
                            variant="body2"
                            textAlign="center"
                            color="textSecondary"
                        >
                            {translatables.texts.complete_courses_rewards_hint || 'Complete courses with rewards enabled to earn NFT certificates and tokens'}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <RewardsTable data={rewards} />
            )}

        </>
    )
}

export default Index
