
import routes from "../../../../helpers/routes.helper"
import { useForm, usePage } from "@inertiajs/inertia-react"
import { Box, Grid, Pagination } from "@mui/material"
import TableLoader from "../../../../components/common/TableLoader"
import WalletHistoryTable from "./components/WalletHistoryTable"

const Index = ({ errors }) => {

    const { wallet_history, page } = usePage().props
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
                    : <WalletHistoryTable data={wallet_history.data} />
            }
            <Grid item xs={12} md={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={wallet_history.last_page}
                        page={wallet_history.current_page}
                        color="primary"
                    />
                </Box>
            </Grid>
        </>
    )
}

export default Index
