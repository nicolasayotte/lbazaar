import { Box, Grid, Typography, Card, CardContent, Container, Divider, Chip, Paper, CircularProgress, Stack, Button, LinearProgress, Dialog, DialogTitle, DialogContent } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import Feedback from "../../../components/cards/Feedback";
import { usePage } from "@inertiajs/inertia-react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../../store/slices/ToasterSlice"
import { formatDualPrice, parseJpy } from "../../../helpers/currency.helper"
import CourseScheduleList from "./components/CourseScheduleList";
import { grey } from "@mui/material/colors";
import Course from "../../../components/cards/Course";
import User from "../../../components/cards/User";
import WalletConnector from "../../../components/cards/WalletConnector"
import StripeCheckout from "../../../components/payments/StripeCheckout";
import axios from "axios";


const Details = () => {

    const dispatch = useDispatch()

    const { auth, course, nft, schedules, feedbacks, translatables, feedbackCount, feedbacksPerPage } = usePage().props

    const [walletStakeKeyDisplay, setwalletStakeKeyDisplay] = useState(undefined)
    const [walletAPI, setWalletAPI] = useState(undefined)

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        text: '',
        value: '',
        submitUrl: '',
        method: null,
        processing: false,
        type: ''
    })


    const [purchaseLoading, setPurchaseLoading] = useState(false)
    const [purchaseStep, setPurchaseStep] = useState('idle')

    const [showStripeCheckout, setShowStripeCheckout] = useState(false)
    const [clientSecret, setClientSecret] = useState(null)
    const [stripeLoading, setStripeLoading] = useState(false)

    const isGeneralCourse = course.course_type && course.course_type.type === 'General'

    const handleBuyWithAda = async (schedule_id) => {
        if (!walletAPI) {
            dispatch(actions.error({
                message: translatables.wallet_error.not_connected
            }))
            return
        }

        try {
            setPurchaseLoading(true)
            setPurchaseStep('building')

            // Get UTXOs and change address from wallet
            const cborUtxos = await walletAPI.getUtxos()
            const changeAddress = await walletAPI.getChangeAddress()

            // Build transaction via backend
            const buildResponse = await axios.post(
                getRoute('course.purchase.build', { schedule_id }),
                { cborUtxos: cborUtxos.join(',') }
            )

            const buildData = typeof buildResponse.data === 'string'
                ? JSON.parse(buildResponse.data)
                : buildResponse.data

            if (!buildData.success) {
                throw new Error(buildData.message || 'Failed to build transaction')
            }

            // Sign transaction with wallet
            setPurchaseStep('signing')
            let walletSig
            try {
                walletSig = await walletAPI.signTx(buildData.data.cborTx, true)
            } catch (signError) {
                if (signError.code === 3 || signError.code === -3) {
                    dispatch(actions.error({
                        message: translatables.wallet_error.verify
                    }))
                    return
                }
                throw signError
            }

            // Submit signed transaction
            setPurchaseStep('submitting')
            const submitResponse = await axios.post(
                getRoute('course.purchase.submit', { schedule_id }),
                { cborSig: walletSig, cborTx: buildData.data.cborTx }
            )

            const submitData = typeof submitResponse.data === 'string'
                ? JSON.parse(submitResponse.data)
                : submitResponse.data

            if (!submitData.success) {
                throw new Error(submitData.message || 'Failed to submit transaction')
            }

            dispatch(actions.success({
                message: translatables.success.class.booking.booked
            }))

            Inertia.visit(getRoute('course.details', { id: course.id }))

        } catch (error) {
            console.error('Purchase error:', error)
            dispatch(actions.error({
                message: error.response?.data?.message || error.message || translatables.error
            }))
        } finally {
            setPurchaseLoading(false)
            setPurchaseStep('idle')
        }
    }

    const handlePayWithCard = async () => {
        if (!auth || !auth.user) {
            dispatch(actions.error({
                message: translatables.error || 'Please log in to continue'
            }))
            return
        }

        try {
            setStripeLoading(true)
            const response = await axios.post(`/api/stripe/payment-intent/${course.id}`)
            const data = response.data

            if (data.success && data.data?.client_secret) {
                setClientSecret(data.data.client_secret)
                setShowStripeCheckout(true)
            } else {
                throw new Error(data.message || 'Failed to initialize payment')
            }
        } catch (error) {
            console.error('Payment initialization error:', error)
            dispatch(actions.error({
                message: error.response?.data?.message || error.message || translatables.error || 'Payment initialization failed'
            }))
        } finally {
            setStripeLoading(false)
        }
    }

    const handleStripeCancel = () => {
        setShowStripeCheckout(false)
        setClientSecret(null)
    }

    const handleBook = async (schedule_id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.book,
            text: translatables.confirm.class.schedules.book,
            submitUrl: getRoute('course.book', { schedule_id }),

            method: 'post',
            action: 'booked'
        }))
    }

    const handleBookNFT = async (schedule_id) => {

        try {
            // get the UTXOs from wallet
            const cborUtxos = await walletAPI.getUtxos()

            await axios.post('/nft/check', {
                nft_name: nft.name,
                utxos: cborUtxos
            })
                .then(async response => {
                    const respObjCheck = await JSON.parse(response.data)
                    if (respObjCheck.status == 200) {

                        let message = translatables.texts.nft_verify
                        let hexMessage = ''

                        for (var i = 0, l = message.length; i < l; i++) {
                            hexMessage += message.charCodeAt(i).toString(16);
                        }

                        try {
                            const { signature, key } = await walletAPI.signData(respObjCheck.addrHex, hexMessage)

                            await axios.post('/nft/verify', {
                                signature: signature,
                                spending_key: key,
                                message: hexMessage,
                                wallet_addr: respObjCheck.addrHex,
                                nft_name: nft.name,
                                serial_num: respObjCheck.serialNum
                            })
                                .then(async response => {
                                    const respObjVerify = await JSON.parse(response.data)

                                    if (respObjVerify.status == 200) {

                                        dispatch(actions.success({
                                            message: translatables.success.nft
                                        }))

                                        setDialog(dialog => ({
                                            ...dialog,
                                            open: true,
                                            title: translatables.texts.book,
                                            text: translatables.confirm.class.schedules.book,
                                            submitUrl: getRoute('course.book', { schedule_id }),
                                            method: 'post',
                                            action: 'booked'
                                        }))
                                    } else {
                                        dispatch(actions.error({
                                            message: translatables.nft_error.verify
                                        }))
                                    }
                                })
                                .catch(error => {
                                    throw console.error("handleNFTVerify: ", error)
                                });
                        } catch (error) {
                            console.warn(error)

                            if (error.code == 3 || error.code == -3) {
                                // User has declined to sign Data, exit gracefully
                                dispatch(actions.error({
                                    message: translatables.nft_error.verify
                                }))
                                return
                            }

                            // Will try using a signed tx because some wallets don't support signData
                            try {
                                // get the UTXOs from wallet,
                                const cborUtxos = await walletAPI.getUtxos()

                                await axios.post('/wallet/build-hw-tx', {
                                    changeAddr: respObjCheck.addrHex,
                                    utxos: cborUtxos
                                })
                                    .then(async response => {
                                        const respObjBuildHw = await JSON.parse(response.data)

                                        if (respObjBuildHw.status == 200) {

                                            // Get user to sign the transaction
                                            var walletSig
                                            try {
                                                walletSig = await walletAPI.signTx(respObjBuildHw.cborTx, true)
                                            } catch (err) {
                                                console.error(err)
                                                dispatch(actions.error({
                                                    message: translatables.nft_error.verify
                                                }))
                                                return
                                            }

                                            await axios.post('/nft/verify-hw', {
                                                walletSig: walletSig,
                                                cborTx: respObjBuildHw.cborTx,
                                                wallet_addr: respObjCheck.addrHex,
                                                nft_name: nft.name,
                                                serial_num: respObjCheck.serialNum
                                            })
                                                .then(async response => {
                                                    const respObj = await JSON.parse(response.data);
                                                    if (respObj.status == 200) {

                                                        dispatch(actions.success({
                                                            message: translatables.success.nft
                                                        }))

                                                        setDialog(dialog => ({
                                                            ...dialog,
                                                            open: true,
                                                            title: translatables.texts.book,
                                                            text: translatables.confirm.class.schedules.book,
                                                            submitUrl: getRoute('course.book', { schedule_id }),
                                                            method: 'post',
                                                            action: 'booked'
                                                        }))
                                                    } else {
                                                        console.error("NFT could not be validated")
                                                        dispatch(actions.error({
                                                            message: translatables.nft_error.verify
                                                        }))
                                                    }
                                                })
                                                .catch(error => {
                                                    throw console.error("NFT could not be validated: ", error);
                                                })

                                        } else {
                                            console.error("NFT could not be validated");
                                            dispatch(actions.error({
                                                message: translatables.nft_error.verify
                                            }))
                                        }
                                    })
                                    .catch(error => {
                                        throw console.error("handleWalletVerify: ", error);
                                    })

                            } catch (error) {
                                console.error(error);
                                dispatch(actions.error({
                                    message: translatables.nft_error.verify
                                }))
                            }
                        }

                    } else {
                        console.error("No NFT found in user wallet");
                        dispatch(actions.error({
                            message: translatables.nft_error.not_found
                        }))
                    }
                })
                .catch(error => {
                    throw console.error("handleNFTCheck: ", error);

                });
        } catch (error) {
            console.error("handleNFTCheck: ", error);
            dispatch(actions.error({
                message: translatables.nft_error.not_found
            }))
        }
    }

    const handleCancelBooking = schedule_id => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.cancel,
            text: translatables.confirm.class.schedules.cancel,
            submitUrl: getRoute('course.cancel', { schedule_id }),
            method: 'post',
            action: 'cancelled'
        }))
    }

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = e => {
        e.preventDefault()

        Inertia.visit(dialog.submitUrl, {
            method: dialog.method,
            errorBag: dialog.action,

            onSuccess: () => dispatch(actions.success({
                message: translatables.success.class.booking[dialog.action]
            })),
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        })
    }

    const handleOnFeedbacksLoad = () => {
        Inertia.visit(getRoute('course.details', { id: course.id }), {
            data: { feedback_count: parseInt(feedbackCount) + parseInt(feedbacksPerPage) },
            only: [
                'feedbacks',
                'feedbackCount'
            ],
            preserveScroll: true
        })
    }

    const Feedbacks = () => {
        const CourseFeedbacks = () => feedbacks && feedbacks.length > 0 && feedbacks.map(feedback => (
            <Feedback
                key={feedback.id}
                auth={auth}
                showUser={auth && auth.user && auth.user.id == course.professor_id}
                feedback={feedback}
            />
        ))

        return (
            <>
                <CourseFeedbacks />
                {
                    feedbacks.length < course.feedbacks.length &&
                    <Box textAlign="center">
                        <Button
                            variant="outlined"
                            children={translatables.texts.load_more}
                            onClick={handleOnFeedbacksLoad}
                        />
                    </Box>
                }
            </>
        )
    }

    const CourseImage = () => (
        <Box sx={{ backgroundColor: '#333', width: '100%' }}>
            <Container>
                <Box
                    sx={{
                        minHeight: {
                            xs: '250px',
                            md: '400px'
                        },
                        width: '100%',
                        backgroundImage: `url(${course.image_thumbnail})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        mb: 2
                    }}
                />
            </Container>
        </Box>
    )

    const Rating = () => {
        return (
            <Paper sx={{ p: 2, mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box position="relative" display="inline-flex">
                        <CircularProgress
                            variant="determinate"
                            value={course.overall_rating}
                            size={80}
                            thickness={5}
                            sx={{
                                position: 'relative',
                                zIndex: 2
                            }}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `9px solid ${grey['300']}`,
                                borderRadius: '100%',
                                zIndex: 1
                            }}
                        >
                            <Typography variant="h5" component="div" color="text.secondary" children={Math.round(course.overall_rating)} />
                        </Box>
                    </Box>
                    <Box>
                        <Typography variant="h5" textAlign="center" children={translatables.texts.overall_rating} />
                        <Typography
                            variant="caption"
                            display="block"
                            color="GrayText"
                            children={`${course.feedbacks.length} ${translatables.title.feedbacks.toLowerCase()}`}
                        />
                    </Box>
                </Stack>
            </Paper>
        )
    }

    const ClassInformation = () => {

        const classInfos = [
            { type: translatables.texts.type, value: course.course_type.type },
            { type: translatables.texts.format, value: course.format }
        ]

        const dynamicInfos = {
            'General': { type: translatables.texts.price, value: formatDualPrice(parseJpy(course.price), course.price_in_ada) },
            'Free': { type: translatables.texts.price, value: translatables.texts.free }
        }

        classInfos.push(dynamicInfos[course.course_type.type])

        return (
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {!nft &&
                    classInfos.map((info, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Paper sx={{ p: 2 }}>
                                <Typography
                                    variant="button"
                                    textAlign="center"
                                    display="block"
                                    children={info.value}
                                />
                                <Typography
                                    variant="caption"
                                    textAlign="center"
                                    display="block"
                                    color="GrayText"
                                    children={info.type}
                                />
                            </Paper>
                        </Grid>
                    ))
                }
                {nft &&
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <Typography
                                variant="button"
                                textAlign="center"
                                display="block"
                                children={nft.name}
                            />
                            <Typography
                                variant="caption"
                                textAlign="center"
                                display="block"
                                color="GrayText"
                                children={nft.points}
                            />
                        </Paper>
                    </Grid>
                }
            </Grid>
        )
    }

    const PackageInformation = () => {

        const packageCourses = course.course_package && course.course_package.courses && course.course_package.courses.length > 0
            ? course.course_package.courses.filter(packageCourse => packageCourse.id != course.id)
            : []

        const PackageCourses = () => packageCourses.map(packageCourse => <Course key={packageCourse.id} course={packageCourse} />)

        return packageCourses.length > 0 && (
            <>
                <Typography variant="h5" children={course.course_package && course.course_package.name} />
                <Typography variant="caption" color="GrayText" children={translatables.texts.complete_classes_earn_badge} />
                <PackageCourses />
            </>
        )
    }

    return (
        <Box>
            <CourseImage />
            <Container>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <ClassInformation />
                        <Card sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="h4" children={course.title} sx={{ my: 1 }} />
                                <Typography variant="subtitle2" children={`By ${course.professor.fullname}`} />
                                <Divider sx={{ my: 2 }} />
                                <div dangerouslySetInnerHTML={{ __html: course.description }} style={{ lineHeight: 1.8 }} />
                            </CardContent>
                        </Card>
                        <User user={course.professor} condensed={false} />
                        {(nft || isGeneralCourse) && auth && auth.user && <Box mb={2}>
                            <WalletConnector onStakeKeyHash={setwalletStakeKeyDisplay}
                                walletAPI={walletAPI}
                                onWalletAPI={setWalletAPI} />
                        </Box>}
                        {isGeneralCourse && auth && auth.user && (
                            <Box sx={{ mb: 2 }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={!walletAPI || purchaseLoading}
                                    onClick={() => {
                                        if (schedules && schedules.length > 0) {
                                            handleBuyWithAda(schedules[0].id)
                                        }
                                    }}
                                    startIcon={purchaseLoading ? <CircularProgress size={20} color="inherit" /> : <AccountBalanceWalletIcon />}
                                    sx={{ py: 1.5 }}
                                >
                                    {purchaseLoading
                                        ? translatables.texts.processing
                                        : `${translatables.texts.buy_with_ada} - ${formatDualPrice(parseJpy(course.price), course.price_in_ada)}`
                                    }
                                </Button>
                                {purchaseLoading && (
                                    <Box sx={{ mt: 1 }}>
                                        <LinearProgress />
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {purchaseStep === 'building' && translatables.texts.building_transaction}
                                            {purchaseStep === 'signing' && translatables.texts.sign_in_wallet}
                                            {purchaseStep === 'submitting' && translatables.texts.submitting_transaction}
                                        </Typography>
                                    </Box>
                                )}
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    fullWidth
                                    disabled={stripeLoading}
                                    onClick={handlePayWithCard}
                                    startIcon={stripeLoading ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
                                    sx={{ py: 1.5, mt: 1 }}
                                >
                                    {stripeLoading
                                        ? (translatables?.texts?.loading || 'Loading...')
                                        : `${translatables?.texts?.pay_with_card || 'Pay with Credit Card'} - ¥${course.price?.toLocaleString()}`
                                    }
                                </Button>
                            </Box>
                        )}
                        {nft && walletAPI && <CourseScheduleList data={schedules} handleOnBook={handleBookNFT} handleOnCancelBook={handleCancelBooking} />}
                        {!nft && <CourseScheduleList data={schedules} handleOnBook={isGeneralCourse ? handleBuyWithAda : handleBook} handleOnCancelBook={handleCancelBooking} />}
                        <PackageInformation />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Rating />
                        <Feedbacks />
                    </Grid>
                </Grid>
            </Container>
            <ConfirmationDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleConfirm={handleOnDialogSubmit}
            />
            <Dialog open={showStripeCheckout} onClose={handleStripeCancel} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {translatables?.texts?.complete_payment || 'Complete Payment'}
                </DialogTitle>
                <DialogContent>
                    <StripeCheckout
                        clientSecret={clientSecret}
                        course={course}
                        onSuccess={() => setShowStripeCheckout(false)}
                        onCancel={handleStripeCancel}
                        translatables={translatables}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    )
}

export default Details;
