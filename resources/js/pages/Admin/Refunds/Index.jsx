import { useState } from 'react'
import { usePage, useForm } from '@inertiajs/inertia-react'
import { Inertia } from '@inertiajs/inertia'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { Box, Button, Card, CardContent, Grid, MenuItem, Pagination, TextField, Typography } from '@mui/material'
import TableLoader from '../../../components/common/TableLoader'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog'
import RefundsTable from './components/RefundsTable'
import RewardsWarningDialog from './components/RewardsWarningDialog'
import routes from '../../../helpers/routes.helper'
import { actions } from '../../../store/slices/ToasterSlice'

const Index = () => {
    const dispatch = useDispatch()
    const { purchases, keyword, payment_method, translatables } = usePage().props

    const { data: filters, setData: setFilters, get, processing } = useForm({
        keyword: keyword ?? '',
        payment_method: payment_method ?? '',
    })

    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        text: '',
        row: null,
    })

    const [rewardsDialog, setRewardsDialog] = useState({
        open: false,
        row: null,
    })

    const [refunding, setRefunding] = useState(false)

    const handleFilterSubmit = (e) => {
        e.preventDefault()
        get(routes['admin.refunds.index'])
    }

    const handleOnPaginate = (e, page) => {
        Inertia.get(routes['admin.refunds.index'], {
            ...filters,
            page,
        }, { preserveState: true })
    }

    const handleRefundClick = (row) => {
        setConfirmDialog({
            open: true,
            title: translatables?.texts?.refund ?? 'Refund',
            text: `Refund <strong>${row.course_name}</strong> for <strong>${row.student_name}</strong> (${row.amount})?`,
            row,
        })
    }

    const handleConfirmDialogConfirm = async () => {
        const row = confirmDialog.row
        setConfirmDialog(d => ({ ...d, open: false }))
        await executeRefund(row, false)
    }

    const handleConfirmDialogClose = () => {
        setConfirmDialog(d => ({ ...d, open: false }))
    }

    const handleRewardsDialogForceConfirm = async () => {
        const row = rewardsDialog.row
        setRewardsDialog({ open: false, row: null })
        await executeRefund(row, true)
    }

    const handleRewardsDialogClose = () => {
        setRewardsDialog({ open: false, row: null })
    }

    const executeRefund = async (row, force) => {
        setRefunding(true)
        try {
            const url = row.type === 'stripe'
                ? `/api/admin/refunds/stripe/${row.stripe_payment_id}`
                : `/api/admin/refunds/ada/${row.course_history_id}`

            const response = await axios.post(url, { force })
            const data = response.data

            if (data.success) {
                dispatch(actions.success({
                    message: row.type === 'stripe'
                        ? (translatables?.success?.refund?.stripe ?? 'Stripe refund processed successfully.')
                        : (translatables?.success?.refund?.ada ?? 'ADA refund submitted successfully.'),
                }))
                Inertia.reload({ only: ['purchases'] })
            } else if (data.hasRewards && !force) {
                setRewardsDialog({ open: true, row })
            } else {
                dispatch(actions.error({ message: data.message || translatables?.error }))
            }
        } catch (err) {
            dispatch(actions.error({ message: err.response?.data?.message || translatables?.error }))
        } finally {
            setRefunding(false)
        }
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 2 }}>
                {translatables?.title?.refunds ?? 'Refund Management'}
            </Typography>

            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <form onSubmit={handleFilterSubmit}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={5}>
                                <TextField
                                    label={translatables?.texts?.keyword ?? 'Keyword'}
                                    placeholder={translatables?.texts?.search ?? 'Search...'}
                                    name="keyword"
                                    value={filters.keyword}
                                    onChange={e => setFilters('keyword', e.target.value)}
                                    fullWidth
                                    size="small"
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    label={translatables?.texts?.payment_method ?? 'Payment Method'}
                                    select
                                    name="payment_method"
                                    value={filters.payment_method}
                                    onChange={e => setFilters('payment_method', e.target.value)}
                                    fullWidth
                                    size="small"
                                >
                                    <MenuItem value="">All</MenuItem>
                                    <MenuItem value="stripe">Stripe</MenuItem>
                                    <MenuItem value="ada">ADA</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    fullWidth
                                >
                                    {translatables?.texts?.filter ?? 'Filter'}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>

            {processing
                ? <TableLoader />
                : <RefundsTable data={purchases.data} onRefund={handleRefundClick} />
            }

            {purchases.last_page > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <Pagination
                        onChange={handleOnPaginate}
                        count={purchases.last_page}
                        page={purchases.current_page}
                        color="primary"
                    />
                </Box>
            )}

            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                text={confirmDialog.text}
                handleClose={handleConfirmDialogClose}
                handleConfirm={handleConfirmDialogConfirm}
                processing={refunding}
            />

            <RewardsWarningDialog
                open={rewardsDialog.open}
                onClose={handleRewardsDialogClose}
                onForceConfirm={handleRewardsDialogForceConfirm}
                processing={refunding}
            />
        </Box>
    )
}

export default Index
