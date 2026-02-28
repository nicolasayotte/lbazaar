import { useForm, usePage, Link } from "@inertiajs/inertia-react"
import { Box, Slider, Button, Card, CardContent, Container, Divider, Grid, Stack, Typography, Avatar, Tooltip, CircularProgress, Alert, Chip } from "@mui/material"
import { actions } from '../../store/slices/ToasterSlice'
import { useDispatch } from "react-redux"
import { getRoute } from "../../helpers/routes.helper"
import Input from "../../components/forms/Input"
import { handleOnChange, handleEditorOnChange } from "../../helpers/form.helper";
import TextEditorInput from "../../components/forms/TextEditorInput"
import BackButton from "../../components/common/BackButton"
import { Email, CalendarMonth, OpenInNew } from "@mui/icons-material"
import { useState } from "react"
import { Inertia } from "@inertiajs/inertia"
import FormDialog from "../../components/common/FormDialog"
import routes from "../../helpers/routes.helper"
import axios from "axios"

const CourseCompleteConfirmation = () => {

    const dispatch = useDispatch()

    const { translatables, course, schedule, auth, errors, certificate, rewards, has_external_wallet } = usePage().props;

    const { post, processing, } = useForm({

    })

    const handleSubmit = (e) => {
        e.preventDefault()

        post(getRoute('course.attend.complete', { course_id: course.id, schedule_id: schedule.id }), {
            onError: () => dispatch(actions.error({
                message: translatables.error
            }))
        });
    }

    const marks = [
        {
            value: 0,
            label: '0',
        },
        {
            value: 100,
            label: '100',
        }
    ];

    const [dialog, setDialog] = useState({
        open: false,
        title: '',
        schedule_id: schedule.id,
        submitUrl: '',
        method: null,
        processing: false,
        type: '',
    })

    // Self-mint state
    const [certMintState, setCertMintState] = useState('idle') // idle | minting | minted | failed
    const [tokenMintState, setTokenMintState] = useState('idle') // idle | minting | minted | failed
    const [certResult, setCertResult] = useState(null)
    const [tokenResult, setTokenResult] = useState(null)
    const [certError, setCertError] = useState(null)
    const [tokenError, setTokenError] = useState(null)

    const handleSelfMint = async (type) => {
        const setMintState = type === 'certificate' ? setCertMintState : setTokenMintState
        const setResult    = type === 'certificate' ? setCertResult    : setTokenResult
        const setError     = type === 'certificate' ? setCertError     : setTokenError

        setMintState('minting')
        setError(null)

        try {
            const url = getRoute('course.attend.self.mint', {
                course_id: course.id,
                schedule_id: schedule.id
            })

            const response = await axios.post(url, { type })

            setMintState('minted')
            setResult(response.data)

        } catch (err) {
            setMintState('failed')
            const message = err.response?.data?.message
                || translatables.error
                || 'Minting failed. Please try again.'
            setError(message)
        }
    }

    const dialogForm = () => <></>

    const handleOnDialogClose = () => {
        setDialog(dialog => ({
            ...dialog,
            open: false
        }))
    }

    const handleOnDialogSubmit = e => {
        e.preventDefault()

        // TODO, actually get this from the database
        //
        if (dialog.submitUrl.startsWith('https://pay.')) {
            // Specify the popup width and height
            const popupWidth = 500;
            const popupHeight = 700;

            // Calculate the center of the screen
            const left = window.top.outerWidth / 2 + window.top.screenX - (popupWidth / 2);
            const top = window.top.outerHeight / 2 + window.top.screenY - (popupHeight / 2);

            const popup = window.open(dialog.submitUrl, "NFT-MAKER PRO Payment Gateway", `popup=1, location=1, width=${popupWidth}, height=${popupHeight}, left=${left}, top=${top}`);
        } else {
            Inertia.visit(dialog.submitUrl, {
                method: dialog.method,
                data: {
                    schedule_id: dialog.schedule_id,
                }
            })
        }
    }

    // Determine initial cert/token status from rewards prop (falls back to legacy certificate prop)
    const rewardsCert  = rewards?.certificate ?? null
    const rewardsToken = rewards?.token ?? null

    const certStatusFromServer  = rewardsCert?.status ?? certificate?.status ?? null
    const tokenStatusFromServer = rewardsToken?.status ?? null

    // Helper: is a reward already minted server-side?
    const isAlreadyMinted = (status) => status === 'minted' || status === 'self_minted'

    // Format lovelace as ADA string
    const lovelaceToAda = (lovelace) => {
        if (!lovelace) return '0'
        return (lovelace / 1_000_000).toFixed(2)
    }

    const renderCertificateBlock = () => {
        if (!rewardsCert) return null

        const serverMinted = isAlreadyMinted(certStatusFromServer)
        const displayState = serverMinted ? 'minted' : certMintState

        return (
            <Box mt={2} p={2} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {translatables.texts?.completion_certificate ?? 'Completion Certificate'}
                    </Typography>
                    <Chip label="NFT" size="small" color="primary" variant="outlined" />
                </Stack>

                {displayState === 'minted' && (
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.contrastText" gutterBottom>
                            {translatables.texts?.certificate_minted ?? 'Your certificate has been minted successfully!'}
                        </Typography>
                        {(certResult?.tx_hash || rewardsCert.tx_hash) && (
                            <Button
                                href={certResult?.explorer_url ?? rewardsCert.explorer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1 }}
                                startIcon={<OpenInNew />}
                            >
                                {translatables.texts?.view_on_explorer ?? 'View on Cardano Explorer'}
                            </Button>
                        )}
                    </Box>
                )}

                {displayState === 'minting' && (
                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="warning.contrastText">
                            {translatables.texts?.certificate_minting ?? 'Minting your certificate on the Cardano blockchain...'}
                        </Typography>
                    </Box>
                )}

                {displayState === 'failed' && (
                    <Box>
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {certError ?? translatables.texts?.certificate_failed ?? 'Certificate minting failed. Please try again.'}
                        </Alert>
                        {has_external_wallet && (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleSelfMint('certificate')}
                            >
                                {translatables.texts?.retry ?? 'Retry'}
                            </Button>
                        )}
                    </Box>
                )}

                {displayState === 'idle' && (
                    <Box>
                        {!has_external_wallet ? (
                            <Alert severity="info">
                                {translatables.texts?.no_wallet_self_mint
                                    ?? 'Connect an external wallet to self-mint your certificate. Your instructor can also airdrop it for you.'}
                            </Alert>
                        ) : (
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="body2" color="text.secondary">
                                    {translatables.texts?.self_mint_fee ?? 'Minting fee'}:{' '}
                                    {lovelaceToAda(rewardsCert.fee_lovelace)} ADA
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => handleSelfMint('certificate')}
                                >
                                    {translatables.texts?.mint_certificate ?? 'Mint Certificate'}
                                </Button>
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>
        )
    }

    const renderTokenBlock = () => {
        if (!rewardsToken) return null

        const serverMinted = isAlreadyMinted(tokenStatusFromServer)
        const displayState = serverMinted ? 'minted' : tokenMintState

        return (
            <Box mt={2} p={2} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        {translatables.texts?.token_reward ?? 'Token Reward'}
                    </Typography>
                    {rewardsToken.amount && (
                        <Chip label={`${rewardsToken.amount} tokens`} size="small" color="secondary" variant="outlined" />
                    )}
                </Stack>

                {displayState === 'minted' && (
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="success.contrastText" gutterBottom>
                            {translatables.texts?.token_minted ?? 'Your token reward has been minted successfully!'}
                        </Typography>
                        {(tokenResult?.tx_hash || rewardsToken.tx_hash) && (
                            <Button
                                href={tokenResult?.explorer_url ?? rewardsToken.explorer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="small"
                                variant="outlined"
                                sx={{ mt: 1 }}
                                startIcon={<OpenInNew />}
                            >
                                {translatables.texts?.view_on_explorer ?? 'View on Cardano Explorer'}
                            </Button>
                        )}
                    </Box>
                )}

                {displayState === 'minting' && (
                    <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="warning.contrastText">
                            {translatables.texts?.token_minting ?? 'Minting your token reward on the Cardano blockchain...'}
                        </Typography>
                    </Box>
                )}

                {displayState === 'failed' && (
                    <Box>
                        <Alert severity="error" sx={{ mb: 1 }}>
                            {tokenError ?? translatables.texts?.token_failed ?? 'Token reward minting failed. Please try again.'}
                        </Alert>
                        {has_external_wallet && (
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleSelfMint('token')}
                            >
                                {translatables.texts?.retry ?? 'Retry'}
                            </Button>
                        )}
                    </Box>
                )}

                {displayState === 'idle' && (
                    <Box>
                        {!has_external_wallet ? (
                            <Alert severity="info">
                                {translatables.texts?.no_wallet_self_mint
                                    ?? 'Connect an external wallet to self-mint your token reward. Your instructor can also airdrop it for you.'}
                            </Alert>
                        ) : (
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="body2" color="text.secondary">
                                    {translatables.texts?.self_mint_fee ?? 'Minting fee'}:{' '}
                                    {lovelaceToAda(rewardsToken.fee_lovelace)} ADA
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    color="secondary"
                                    onClick={() => handleSelfMint('token')}
                                >
                                    {translatables.texts?.mint_token ?? 'Mint Token Reward'}
                                </Button>
                            </Stack>
                        )}
                    </Box>
                )}
            </Box>
        )
    }

    const hasAnyReward = rewardsCert || rewardsToken

    return (
        <Box sx={{ minHeight: '80.75vh' }}>
            <Container>
                <Grid container>
                    <Grid item xs={12} md={8} mx="auto" py={5}>
                        <Card>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h5" align="center">{translatables.texts.complete_class} {course.title}?</Typography>
                                <Grid item xs={12} md={11} mx="auto" py={4}>
                                    <Grid container alignItems="center" spacing={{ xs: 2, md: 5 }}>
                                        <Grid item xs={12} md={4}>
                                            <Avatar
                                                src={course.professor.image}
                                                variant="circular"
                                                sx={{
                                                    width: 100,
                                                    height: 100,
                                                    maxWidth: '100%',
                                                    mx: 'auto'
                                                }}
                                            />
                                            <Box textAlign="center" my={2}>
                                                {course.professor.fullname}
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} md={8}>
                                            {course.professor.specialty}
                                            <Divider sx={{ my: 2 }} />
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Tooltip title="Date Joined" arrow>
                                                    <CalendarMonth />
                                                </Tooltip>
                                                {course.professor.created_at}
                                            </Box>
                                            <Box display="flex" alignItems="center" mb={1}>
                                                <Tooltip title="Email" arrow>
                                                    <Email />
                                                </Tooltip>
                                                {course.professor.email}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle1" align="center">"{translatables.texts.complete_class_confirmation_message}"</Typography>

                                {/* Rewards section — certificate + token self-mint */}
                                {hasAnyReward && (
                                    <Box mt={3} p={2} sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {translatables.texts?.rewards_available ?? 'Rewards Available'}
                                        </Typography>

                                        {renderCertificateBlock()}
                                        {renderTokenBlock()}
                                    </Box>
                                )}

                                {/* Legacy certificate block for backward compatibility when rewards prop is absent */}
                                {!hasAnyReward && course.certificate_enabled && certificate && (
                                    <Box mt={3} p={2} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                                        <Typography variant="h6" gutterBottom>
                                            {translatables.texts.completion_certificate || 'Completion Certificate'}
                                        </Typography>

                                        {certificate.status === 'not_eligible' && (
                                            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                                                <Typography variant="body2" color="info.contrastText">
                                                    {translatables.texts.certificate_eligible || 'Your NFT certificate will be minted by the instructor soon!'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {certificate.status === 'pending' && (
                                            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <CircularProgress size={20} />
                                                <Typography variant="body2" color="warning.contrastText">
                                                    {translatables.texts.certificate_minting || 'Your certificate is being minted on the Cardano blockchain...'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {certificate.status === 'minted' && (
                                            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                                <Typography variant="body2" color="success.contrastText" gutterBottom>
                                                    {translatables.texts.certificate_minted || 'Your certificate has been minted successfully!'}
                                                </Typography>
                                                {certificate.minted_at && (
                                                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                                        {translatables.texts.minted_on || 'Minted on'}: {certificate.minted_at}
                                                    </Typography>
                                                )}
                                                {certificate.explorer_url && (
                                                    <Button
                                                        href={certificate.explorer_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ mt: 1 }}
                                                        startIcon={<OpenInNew />}
                                                    >
                                                        {translatables.texts.view_on_explorer || 'View on Cardano Explorer'}
                                                    </Button>
                                                )}
                                            </Box>
                                        )}

                                        {certificate.status === 'failed' && (
                                            <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                                                <Typography variant="body2" color="error.contrastText">
                                                    {translatables.texts.certificate_failed || 'Certificate minting failed. Please contact the instructor.'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                )}

                                <Divider sx={{ my: 2 }} />
                                <Grid container spacing={2}>

                                    <Grid item xs={12}>
                                        <Stack direction="row" spacing={1} justifyContent="end">
                                            <Link href={getRoute('course.attend.index', { course_id: course.id, schedule_id: schedule.id })} >
                                                <Button
                                                    variant="outlined"
                                                    children={translatables.texts.back}

                                                />
                                            </Link>
                                            <Button
                                                onClick={handleSubmit}
                                                variant="contained"
                                                disabled={processing}
                                            >{translatables.texts.complete}</Button>
                                        </Stack>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            <FormDialog
                {...dialog}
                handleClose={handleOnDialogClose}
                handleSubmit={handleOnDialogSubmit}
                children={dialogForm()}
                disableSubmit={false}
            />
        </Box>
    )
}

export default CourseCompleteConfirmation
