
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Grid, Pagination, Button } from "@mui/material"
import TableLoader from "../../../../components/common/TableLoader"
import BadgesTable from "./components/BadgesTable"
import { Link } from "@inertiajs/inertia-react"
import { getRoute } from "../../../../helpers/routes.helper"

const Index = ({ errors }) => {

    const { user_badges, page, translatables, auth } = usePage().props
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
