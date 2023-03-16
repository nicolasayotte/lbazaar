
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Grid, Pagination, Button, Typography } from "@mui/material"
import TableLoader from "../../../../components/common/TableLoader"
import BadgesTable from "./components/BadgesTable"
import { Link } from "@inertiajs/inertia-react"
import { getRoute } from "../../../../helpers/routes.helper"
import { LocalPolice as Badge } from "@mui/icons-material"

const Index = ({ errors }) => {

    const { user_badges, page, translatables, auth, title } = usePage().props
    const { get, processing, transform } = useForm({
        page
    })

    const handleOnPaginate = (e, page) => {
        transform(filters => ({
            page
        }))
        handleFilterSubmit(e)
    }

    const handleFilterSubmit = (e) => {
        e.preventDefault()

        get(routes["mypage.wallet.history.index"])
    }


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
                                    children={` ${translatables.texts.total_badges} : ${auth.user.badges.length}`}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
            {
                processing
                ? <TableLoader />
                : <BadgesTable data={user_badges.data}/>
            }
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={user_badges.last_page}
                        page={user_badges.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
