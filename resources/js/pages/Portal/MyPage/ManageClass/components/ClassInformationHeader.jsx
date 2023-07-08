import { Link, usePage } from "@inertiajs/inertia-react"
import { Box, Button, Chip, Container, Grid, Stack, Typography } from "@mui/material"
import Header from "../../../../../components/common/Header"
import routes, { getRoute } from "../../../../../helpers/routes.helper"
import placeholderImg from "../../../../../../img/placeholder.png"

const ClassInformationHeader = () => {

    const { course, translatables, nft } = usePage().props
   
    const isEarn = course.course_type.type == 'Earn'
    const isFree = course.course_type.type == 'Free'
    const isLive = course.is_live
    const price = (isEarn || isFree) ? translatables.texts.free : course.price

    const typeColors = {
        'Free': 'success',
        'General': 'primary',
        'Earn': 'info',
        'Special': 'warning'
    }

    return (
        <>
            <Header
                minHeight="250px"
                backgroundImageURL={course.image_thumbnail ?? placeholderImg}
            />
            <Container>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={9}>
                        <Typography variant="h5" children={course.title} />
                    </Grid>
                    <Grid item xs={12} md={3} textAlign="right">
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Link href={routes["mypage.course.manage_class.index"]}>
                                    <Button
                                        variant="outlined"
                                        children={translatables.texts.back}
                                        fullWidth
                                    />
                                </Link>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Link href={getRoute('course.edit', { id: course.id })}>
                                    <Button
                                        variant="contained"
                                        children={translatables.texts.edit_class}
                                        fullWidth
                                    />
                                </Link>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                <Stack
                    direction="row"
                    spacing={{ xs: 0, md: 2 }}
                    rowGap={{ xs: 1, md: 0 }}
                    my={3}
                    divider={<Typography children="|" color="GrayText" sx={{ display: { xs: 'none', md: 'block' } }} />}
                    flexWrap="wrap"
                >
                    <Box width={{ xs: '50%', md: 'auto' }}>
                        <Typography variant="span" mr={1} children={translatables.texts.type} />
                        <Chip color={typeColors[course.course_type.type]} size="small" label={course.course_type && course.course_type.name} />
                    </Box>
                    <Box width={{ xs: '50%', md: 'auto' }}>
                        <Typography variant="span" mr={1} children={translatables.texts.format} />
                        <Chip size="small" label={course.is_live ? 'Live' : 'On-Demand'} />
                    </Box>
                    <Box width={{ xs: '50%', md: 'auto' }}>
                        <Typography variant="span" mr={1} children={translatables.texts.category} />
                        <Chip size="small" label={course.course_category && course.course_category.name} />
                    </Box>
                    {
                        isLive &&
                        <Box width={{ xs: '50%', md: 'auto' }}>
                            <Typography variant="span" mr={1} children={translatables.texts.seats} />
                            <Chip size="small" label={course.max_participant} />
                        </Box>
                    }
                    {
                        !nft &&
                        <Box width={{ xs: '50%', md: 'auto' }}>
                        <Typography variant="span" mr={1} children={translatables.texts.price} />
                        <Chip size="small" label={price} />
                        </Box>
                    }
                    {
                        nft &&
                        <Box width={{ xs: '50%', md: 'auto' }}>
                        <Typography variant="span" mr={1} children={translatables.texts.nft} />
                        </Box>
                    }
                    {
                        isEarn &&
                        <Box width={{ xs: '50%', md: 'auto' }}>
                            <Typography variant="span" mr={1} children={translatables.texts.points_earned} />
                            <Chip size="small" label={course.points_earned.toFixed(2)} />
                        </Box> 
                    }                    
                    <Box width={{ xs: '50%', md: 'auto' }}>
                        <Typography variant="span" mr={1} children={translatables.texts.rating} />
                        <Chip size="small" label={course.overall_rating > 0 ? course.overall_rating.toFixed(1) : 0} />
                    </Box>
                </Stack>
            </Container>
        </>
    )
}

export default ClassInformationHeader
