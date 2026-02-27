import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Grid, Pagination } from "@mui/material"
import TableLoader from "../../../../components/common/TableLoader"
import PurchaseHistoryTable from "./components/PurchaseHistoryTable"

const Index = ({ errors }) => {

    const { purchases, page } = usePage().props
    const { get, processing, transform } = useForm({
        page: purchases ? purchases.current_page : 1
    })

    const handleOnPaginate = (e, newPage) => {
        transform(() => ({
            page: newPage
        }))
        handleFilterSubmit(e)
    }

    const handleFilterSubmit = (e) => {
        e.preventDefault()
        get(routes["mypage.purchase.history.index"])
    }

    return (
        <>
            {
                processing
                    ? <TableLoader />
                    : <PurchaseHistoryTable data={purchases ? purchases.data : []} />
            }
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={purchases ? purchases.last_page : 1}
                        page={purchases ? purchases.current_page : 1}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
