import { Box, Grid, Typography, Card, CardContent, Container, Divider, Chip, Paper, CircularProgress, Stack, Button, LinearProgress, Dialog, DialogTitle, DialogContent, Alert } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import Feedback from "../../../components/cards/Feedback";
import { usePage } from "@inertiajs/inertia-react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { useState, useRef, useEffect } from "react"
import { useDispatch } from "react-redux"
import { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../../store/slices/ToasterSlice"
import { formatDualPrice, formatJpy, parseJpy } from "../../../helpers/currency.helper"
import { encodeCip30LovelaceAmount } from "../../../helpers/cip30.helper"
import CourseScheduleList from "./components/CourseScheduleList";
import { grey } from "@mui/material/colors";
import Course from "../../../components/cards/Course";
import User from "../../../components/cards/User";
import WalletConnector from "../../../components/cards/WalletConnector"
import StripeCheckout from "../../../components/payments/StripeCheckout";
import CardanoNetworkStatus from "../../../components/cards/CardanoNetworkStatus"
import axios from "axios";


const Details = () => {

    const dispatch = useDispatch()

    const { auth, course, nft, schedules, feedbacks, translatables, feedbackCount, feedbacksPerPage, pendingPayment, explorerUrl, stripe_available: stripeAvailable, is_teacher: isTeacher, cardano_network_status: cardanoNetworkStatus = 'healthy' } = usePage().props

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

    const creditCardButtonRef = useRef(null)

    // Confirmation polling state
    const [confirmations, setConfirmations] = useState(null)
    const [pollFailed, setPollFailed] = useState(false)
    const confirmationPollRef = useRef(null)

    // Gap 1: quote countdown
    const [quoteExpiresAt, setQuoteExpiresAt] = useState(null)
    const [quoteSecondsLeft, setQuoteSecondsLeft] = useState(null)
    const quoteTimerRef = useRef(null)

    // Gap 3: ADA price refresh + drift
    const adaPriceAtLoad = useRef(course.price_in_ada)
    const [currentAdaPrice, setCurrentAdaPrice] = useState(course.price_in_ada)

    // Gap 4: explicit availability flag
    const { ada_available: adaAvailableFromServer = true } = usePage().props
    const [adaAvailable, setAdaAvailable] = useState(adaAvailableFromServer)
    const [driftWarning, setDriftWarning] = useState(false)

    // Live network status (server-side prop as initial, updated by polling)
    const [liveNetworkStatus, setLiveNetworkStatus] = useState(cardanoNetworkStatus)

    const [showStripeCheckout, setShowStripeCheckout] = useState(false)
    const [clientSecret, setClientSecret] = useState(null)
    const [stripeLoading, setStripeLoading] = useState(false)

    // 60-second ADA price polling
    useEffect(() => {
        if (!course.price) return
        const poll = async () => {
            try {
                const res = await axios.get(`/api/courses/${course.id}/ada-price`)
                const { available, data } = res.data
                setAdaAvailable(available)
                if (available && data?.price_in_ada) {
                    setCurrentAdaPrice(data.price_in_ada)
                    if (adaPriceAtLoad.current > 0) {
                        const drift = Math.abs(data.price_in_ada - adaPriceAtLoad.current) / adaPriceAtLoad.current
                        setDriftWarning(drift > 0.05)
                    }
                } else {
                    setCurrentAdaPrice(null)
                }
            } catch (_) {}
        }
        const id = setInterval(poll, 60_000)
        return () => clearInterval(id)
    }, [course.id])

    // 60-second Cardano network status polling
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await axios.get('/api/cardano/network-status')
                const status = res.data?.status ?? 'healthy'
                setLiveNetworkStatus(status)
                if (status === 'unreachable') {
                    setAdaAvailable(false)
                } else {
                    setAdaAvailable(currentAdaPrice !== null)
                }
            } catch (_) {}
        }
        const id = setInterval(poll, 60_000)
        return () => clearInterval(id)
    }, [currentAdaPrice])

    // Quote countdown
    useEffect(() => {
        if (!quoteExpiresAt) return
        const expiresMs = new Date(quoteExpiresAt).getTime()
        quoteTimerRef.current = setInterval(() => {
            const left = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000))
            setQuoteSecondsLeft(left)
            if (left === 0) {
                clearInterval(quoteTimerRef.current)
                setQuoteExpiresAt(null)
                setQuoteSecondsLeft(null)
                setPurchaseLoading(false)
                setPurchaseStep('idle')
            }
        }, 1000)
        return () => clearInterval(quoteTimerRef.current)
    }, [quoteExpiresAt])

    // Confirmation polling useEffect
    useEffect(() => {
        if (!pendingPayment?.payment_tx_hash) return
        let active = true
        const poll = async () => {
            if (!active) return
            try {
                const res = await axios.get(`/api/purchases/${pendingPayment.payment_tx_hash}/status`)
                if (!active || !res?.data?.success || !res?.data?.data) return
                const { status, confirmations: count } = res.data.data
                if (status === 'confirmed') {
                    setConfirmations(10)
                    clearInterval(confirmationPollRef.current)
                    setTimeout(() => { if (active) Inertia.visit(window.location.pathname) }, 1500)
                } else if (status === 'failed') {
                    clearInterval(confirmationPollRef.current)
                    setPollFailed(true)
                } else if (status === 'pending') {
                    setConfirmations(count ?? 0)
                }
            } catch (_) {}
        }
        poll()
        confirmationPollRef.current = setInterval(poll, 15_000)
        return () => { active = false; clearInterval(confirmationPollRef.current) }
    }, [pendingPayment?.payment_tx_hash])

    const isGeneralCourse = course.course_type && course.course_type.name === 'General'

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
            // Pass an amount hint so the wallet returns enough UTxOs to cover the
            // purchase plus headroom for change-output splitting if the address holds
            // unrelated NFTs. Without a hint many wallets return only a default
            // subset, which can be ADA-poor even when the wallet is well-funded.
            const amountHint = encodeCip30LovelaceAmount(100_000_000) // 100 ADA
            const cborUtxos = await walletAPI.getUtxos(amountHint)
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
                if (buildData.insufficientFunds) {
                    dispatch(actions.error({ message: translatables.wallet_error.insufficient_funds }))
                    creditCardButtonRef.current?.scrollIntoView({ behavior: 'smooth' })
                } else if (buildData.quoteExpired) {
                    dispatch(actions.error({ message: translatables?.texts?.quote_expired ?? 'The price quote has expired. Please try again.' }))
                } else {
                    throw new Error(buildData.message || 'Failed to build transaction')
                }
                return
            }

            if (buildData.data?.quoteExpiresAt) {
                setQuoteExpiresAt(buildData.data.quoteExpiresAt)
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
                if (submitData.duplicate) {
                    dispatch(actions.error({ message: translatables?.texts?.duplicate_payment ?? 'This transaction has already been submitted. Please check your purchase history.' }))
                    return
                }
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
            clearInterval(quoteTimerRef.current)
            setQuoteExpiresAt(null)
            setQuoteSecondsLeft(null)
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
            'General': {
                type: translatables.texts.price,
                value: course.price_in_ada
                    ? formatDualPrice(parseJpy(course.price), course.price_in_ada)
                    : `${formatJpy(parseJpy(course.price))} (${translatables.texts.ada_unavailable})`
            },
            'Free': { type: translatables.texts.price, value: translatables.texts.free }
        }

        const dynamicInfo = dynamicInfos[course.course_type.name]
        if (dynamicInfo) classInfos.push(dynamicInfo)

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
                        {(nft || isGeneralCourse) && auth && auth.user && !isTeacher && <Box mb={2}>
                            <WalletConnector onStakeKeyHash={setwalletStakeKeyDisplay}
                                walletAPI={walletAPI}
                                onWalletAPI={setWalletAPI} />
                        </Box>}
                        {isGeneralCourse && auth && auth.user && !isTeacher && (
                            <Box sx={{ mb: 2 }}>
                                {(pendingPayment && !pollFailed) ? (
                                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
                                        <LinearProgress
                                            variant={confirmations !== null ? 'determinate' : 'indeterminate'}
                                            value={confirmations !== null ? (confirmations / 10) * 100 : undefined}
                                            sx={{ mb: 1 }}
                                        />
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {confirmations !== null
                                                ? translatables.texts.payment_confirmations
                                                    .replace(':current', confirmations)
                                                    .replace(':required', 10)
                                                : translatables.texts.payment_pending
                                            }
                                        </Typography>
                                        <Typography variant="body2">
                                            <a
                                                href={`${explorerUrl}/transaction/${pendingPayment.payment_tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {translatables.texts.view_on_explorer}
                                            </a>
                                        </Typography>
                                        {!walletAPI && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {translatables?.texts?.wallet_disconnected_pending
                                                    ?? 'Your wallet disconnected, but your pending transaction is still being tracked on the blockchain.'}
                                            </Typography>
                                        )}
                                    </Box>
                                ) : (
                                    <>
                                        {pollFailed && (
                                            <Box sx={{ mb: 1, p: 1.5, border: '1px solid', borderColor: 'error.main', borderRadius: 1 }}>
                                                <Typography variant="body2" color="error">
                                                    {translatables.texts.payment_failed_retry}
                                                </Typography>
                                            </Box>
                                        )}
                                        <CardanoNetworkStatus status={liveNetworkStatus} translatables={translatables} />
                                        {!adaAvailable && stripeAvailable === false && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                {translatables?.texts?.purchases_unavailable ?? 'Purchases are temporarily unavailable. Please try again later.'}
                                            </Alert>
                                        )}
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            disabled={!walletAPI || purchaseLoading || !adaAvailable}
                                            onClick={() => {
                                                if (schedules && schedules.length > 0) {
                                                    handleBuyWithAda(schedules[0].id)
                                                } else {
                                                    dispatch(actions.error({ message: translatables?.texts?.no_schedule ?? 'No schedule available for this course.' }))
                                                }
                                            }}
                                            startIcon={purchaseLoading ? <CircularProgress size={20} color="inherit" /> : <AccountBalanceWalletIcon />}
                                            sx={{ py: 1.5 }}
                                        >
                                            {purchaseLoading
                                                ? translatables.texts.processing
                                                : `${translatables.texts.buy_with_ada || 'Buy with ADA'} - ${formatDualPrice(parseJpy(course.price), currentAdaPrice)}`
                                            }
                                        </Button>
                                        {driftWarning && (
                                            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                                                {translatables?.texts?.ada_price_changed ?? 'ADA price has shifted >5% since page load. Confirm before paying.'}
                                            </Typography>
                                        )}
                                        {!adaAvailable && (
                                            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                                                {translatables?.texts?.ada_rate_unavailable ?? 'ADA price temporarily unavailable. You can still pay by credit card.'}
                                            </Typography>
                                        )}
                                        {purchaseLoading && (
                                            <Box sx={{ mt: 1 }}>
                                                <LinearProgress />
                                                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                    {purchaseStep === 'building' && translatables.texts.building_transaction}
                                                    {purchaseStep === 'signing' && translatables.texts.sign_in_wallet}
                                                    {purchaseStep === 'submitting' && translatables.texts.submitting_transaction}
                                                </Typography>
                                                {quoteSecondsLeft !== null && (
                                                    <Typography variant="caption" color={quoteSecondsLeft < 30 ? 'error' : 'text.secondary'} display="block">
                                                        Quote expires in {quoteSecondsLeft}s
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                        <Button
                                            ref={creditCardButtonRef}
                                            variant="outlined"
                                            color="primary"
                                            fullWidth
                                            disabled={stripeLoading || stripeAvailable === false}
                                            onClick={handlePayWithCard}
                                            startIcon={stripeLoading ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
                                            sx={{ py: 1.5, mt: 1 }}
                                        >
                                            {stripeLoading
                                                ? (translatables?.texts?.loading || 'Loading...')
                                                : `${translatables?.texts?.pay_with_card || 'Pay with Credit Card'} - ¥${course.price?.toLocaleString()}`
                                            }
                                        </Button>
                                        {stripeAvailable === false && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {translatables?.texts?.stripe_unavailable || 'Credit card payment temporarily unavailable'}
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                        )}
                        {isGeneralCourse && auth && auth.user && isTeacher && (
                            <Box sx={{ mb: 2 }}>
                                <Alert severity="info" sx={{ mb: 1 }}>
                                    {translatables?.texts?.teacher_view_label ?? 'Teacher view — pricing preview only'}
                                </Alert>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    disabled
                                    startIcon={<AccountBalanceWalletIcon />}
                                    sx={{ py: 1.5 }}
                                >
                                    {`${translatables.texts.buy_with_ada || 'Buy with ADA'} - ${formatDualPrice(parseJpy(course.price), currentAdaPrice)}`}
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    disabled
                                    startIcon={<CreditCardIcon />}
                                    sx={{ py: 1.5, mt: 1 }}
                                >
                                    {`${translatables?.texts?.pay_with_card || 'Pay with Credit Card'} - ¥${course.price?.toLocaleString()}`}
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
