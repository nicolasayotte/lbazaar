import { Box, Grid, Typography, Card, CardContent, Container, Divider, Chip, Paper, CircularProgress, Stack, Button } from "@mui/material";
import Feedback from "../../../components/cards/Feedback";
import { usePage } from "@inertiajs/inertia-react"
import ConfirmationDialog from "../../../components/common/ConfirmationDialog"
import { useState } from "react"
import { useDispatch } from "react-redux"
import { getRoute } from "../../../helpers/routes.helper"
import { Inertia } from "@inertiajs/inertia"
import { actions } from "../../../store/slices/ToasterSlice"
import CourseScheduleList from "./components/CourseScheduleList";
import { grey } from "@mui/material/colors";
import Course from "../../../components/cards/Course";
import User from "../../../components/cards/User";
import WalletConnector from "../../../components/cards/WalletConnector"
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

    const handleBook = async (schedule_id) => {
        setDialog(dialog => ({
            ...dialog,
            open: true,
            title: translatables.texts.book,
            text: translatables.confirm.class.schedules.book,
            submitUrl: getRoute('course.book', {schedule_id}),
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
                            nft_name : nft.name,
                            serial_num : respObjCheck.serialNum
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
                                    submitUrl: getRoute('course.book', {schedule_id}),
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

                        if (error.code == 3 || error.code == -3 ) {
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
                                        nft_name : nft.name,
                                        serial_num : respObjCheck.serialNum
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
                                                submitUrl: getRoute('course.book', {schedule_id}),
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
            submitUrl: getRoute('course.cancel', {schedule_id}),
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
            data: {feedback_count: parseInt(feedbackCount) + parseInt(feedbacksPerPage)},
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
            'General': { type: translatables.texts.price, value: course.price },
            'Free': { type: translatables.texts.price, value: 'Free' },
            'Earn': { type: translatables.texts.points_earned, value: course.points_earned }
        }

        classInfos.push(dynamicInfos[course.course_type.type])

        return (
            <Grid container spacing={2} sx={{ mb: 2 }}>
                {   !nft &&
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
                {   nft &&
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
                        {nft && <Box mb={2}>
                            <WalletConnector onStakeKeyHash={setwalletStakeKeyDisplay}
                                     walletAPI={walletAPI}
                                     onWalletAPI={setWalletAPI}/>
                        </Box>}
                        {nft && walletAPI &&<CourseScheduleList data={schedules} handleOnBook={handleBookNFT} handleOnCancelBook={handleCancelBooking} />}
                        {!nft &&<CourseScheduleList data={schedules} handleOnBook={handleBook} handleOnCancelBook={handleCancelBooking} />}
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
        </Box>
    )
}

export default Details;
