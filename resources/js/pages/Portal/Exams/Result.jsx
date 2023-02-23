import { usePage } from "@inertiajs/inertia-react";
import { Box, Button, Card, CardContent, Container, Grid, Typography } from "@mui/material";

const Result = () => {

    const { result, translatables } = usePage().props

    return (
        <Container>
            <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ minHeight: '100vh' }}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box my={4}>
                                <Typography textAlign="center" children={translatables.texts.score} />
                                <Typography
                                    variant="h3"
                                    children={`${result.total_score}/${result.exam.total_points}`}
                                    textAlign="center"
                                />
                            </Box>
                            <Button
                                fullWidth
                                variant="contained"
                                children={translatables.texts.back_to_class}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    )
}

export default Result;
