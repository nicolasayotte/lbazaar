import { Card, CardContent, Grid, Skeleton } from "@mui/material"

const CardLoader = () => {
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <Skeleton
                            variant="rounded"
                            width="100%"
                            height="100%"
                            sx={{
                                minHeight: {
                                    xs: '200px'
                                }
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Skeleton width="20%" variant="text" sx={{ fontSize: '1rem' }} />
                        <Skeleton width="80%" variant="text" sx={{ fontSize: '2rem' }} />
                        <Skeleton width="50%" variant="text" sx={{ fontSize: '1.5rem', mt: 3 }} />
                        <Skeleton width="30%" variant="text" sx={{ fontSize: '1.5rem' }} />
                        <Skeleton width="50%" variant="text" sx={{ fontSize: '1.5rem', mt: 3 }} />
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    )
}

export default CardLoader
