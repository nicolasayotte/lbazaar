import { usePage } from '@inertiajs/inertia-react'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Grid,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import axios from 'axios'
import WalletConnector from '../../../../components/cards/WalletConnector'
import CertificateTable from './components/CertificateTable'
import AirdropFeeDialog from './components/AirdropFeeDialog'
import AirdropResultsDialog from './components/AirdropResultsDialog'

const Certificates = () => {
    const {
        course,
        students,
        translatables,
        explorerUrl,
        has_rewards: hasRewards,
    } = usePage().props

    // Wallet state
    const [walletAPI, setWalletAPI] = useState(undefined)
    const [walletStakeKeyDisplay, setWalletStakeKeyDisplay] = useState(undefined)

    // Selection state
    const [selectedStudentIds, setSelectedStudentIds] = useState([])

    // Airdrop process state
    const [airdropping, setAirdropping] = useState(false)

    // Fee dialog state
    const [feeDialogOpen, setFeeDialogOpen] = useState(false)
    const [feeLoading, setFeeLoading] = useState(false)
    const [feeData, setFeeData] = useState(null)

    // Results dialog state
    const [resultsDialogOpen, setResultsDialogOpen] = useState(false)
    const [airdropResults, setAirdropResults] = useState(null)

    // Derived state
    const eligibleStudents = (students ?? []).filter(
        (s) => s.delivery_status === 'eligible'
    )
    const hasStudents = students && students.length > 0
    const hasEligibleStudents = eligibleStudents.length > 0

    const handleSelectAll = () => {
        setSelectedStudentIds(eligibleStudents.map((s) => s.id))
    }

    const handleClearSelection = () => {
        setSelectedStudentIds([])
    }

    const handleToggleSelect = (studentId) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        )
    }

    // Parse CIP-30 CBOR-encoded wallet balance to lovelace integer.
    // Handles CBOR major type 0 (unsigned int) for lovelace-only wallets.
    // Wallets with native tokens use a CBOR array — returns 0 in that case (known limitation).
    const parseCborLovelace = async () => {
        try {
            const balanceCbor = await walletAPI.getBalance()
            const bytes = balanceCbor.match(/.{1,2}/g).map((b) => parseInt(b, 16))
            const firstByte = bytes[0]
            const majorType = (firstByte >> 5) & 0x07
            if (majorType === 0) {
                const additionalInfo = firstByte & 0x1f
                if (additionalInfo <= 23) return additionalInfo
                if (additionalInfo === 24) return bytes[1]
                if (additionalInfo === 25) return (bytes[1] << 8) | bytes[2]
                if (additionalInfo === 26) return (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4]
                if (additionalInfo === 27) {
                    return Number(BigInt('0x' + bytes.slice(1, 9).map((b) => b.toString(16).padStart(2, '0')).join('')))
                }
            }
            // CBOR array (multi-asset wallet) — extract first element (lovelace)
            if (majorType === 4) {
                const innerMajor = (bytes[1] >> 5) & 0x07
                if (innerMajor === 0) {
                    const info = bytes[1] & 0x1f
                    if (info <= 23) return info
                    if (info === 24) return bytes[2]
                    if (info === 25) return (bytes[2] << 8) | bytes[3]
                    if (info === 26) return (bytes[2] << 24) | (bytes[3] << 16) | (bytes[4] << 8) | bytes[5]
                    if (info === 27) {
                        return Number(BigInt('0x' + bytes.slice(2, 10).map((b) => b.toString(16).padStart(2, '0')).join('')))
                    }
                }
            }
            return 0
        } catch (_) {
            return 0
        }
    }

    const openFeeDialog = async (studentIds) => {
        if (!walletAPI || studentIds.length === 0) return

        try {
            setFeeLoading(true)
            setFeeData(null)
            setFeeDialogOpen(true)

            const walletBalanceLovelace = await parseCborLovelace()

            const response = await axios.post(
                `/api/certificates/courses/${course.id}/estimate-fee`,
                {
                    student_ids: studentIds,
                    wallet_balance_lovelace: walletBalanceLovelace,
                }
            )

            const data =
                typeof response.data === 'string'
                    ? JSON.parse(response.data)
                    : response.data

            if (data.success) {
                setFeeData(data.data)
            }
        } catch (err) {
            console.error('Fee estimation failed:', err)
        } finally {
            setFeeLoading(false)
        }
    }

    const handleAirdropClick = () => openFeeDialog(selectedStudentIds)

    const handleFeeConfirm = async () => {
        setFeeDialogOpen(false)
        setAirdropping(true)

        try {
            const response = await axios.post('/api/certificates/mint-and-airdrop', {
                course_id:   course.id,
                student_ids: selectedStudentIds,
            })

            const data =
                typeof response.data === 'string'
                    ? JSON.parse(response.data)
                    : response.data

            setAirdropResults(data)
            setResultsDialogOpen(true)
        } catch (err) {
            console.error('Airdrop failed:', err)
            setAirdropResults({
                success: false,
                message: err?.response?.data?.message ?? 'Airdrop failed',
                results: selectedStudentIds.map((id) => ({
                    student_id: id,
                    success: false,
                    reason: 'Airdrop request failed',
                })),
            })
            setResultsDialogOpen(true)
        } finally {
            setAirdropping(false)
        }
    }

    const handleRetryFailed = (failedIds) => {
        setResultsDialogOpen(false)
        setSelectedStudentIds(failedIds)
        openFeeDialog(failedIds)
    }

    const walletNotConnected = !walletAPI
    const noSelection = selectedStudentIds.length === 0
    const airdropDisabled = walletNotConnected || noSelection || airdropping

    const airdropTooltip = walletNotConnected
        ? (translatables?.texts?.connect_wallet_to_airdrop ?? 'Connect your wallet to airdrop certificates')
        : noSelection
        ? (translatables?.texts?.select_students_to_airdrop ?? 'Select students to airdrop')
        : null

    return (
        <>
            {/* Wallet connector */}
            <Box mb={3}>
                <WalletConnector
                    onStakeKeyHash={(display) => setWalletStakeKeyDisplay(display)}
                    walletAPI={walletAPI}
                    onWalletAPI={setWalletAPI}
                />
            </Box>

            <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h5">
                        {translatables?.texts?.certificates ?? 'Completion Certificates'}
                    </Typography>
                </Grid>

                <Grid item xs={12} md="auto">
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {hasEligibleStudents && (
                            <>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={handleSelectAll}
                                    disabled={airdropping}
                                >
                                    {translatables?.texts?.select_all_eligible ?? `Select All Eligible (${eligibleStudents.length})`}
                                </Button>
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={handleClearSelection}
                                    disabled={airdropping || selectedStudentIds.length === 0}
                                >
                                    {translatables?.texts?.clear_selection ?? 'Clear'}
                                </Button>
                            </>
                        )}

                        <Tooltip title={airdropTooltip ?? ''} disableHoverListener={!airdropTooltip}>
                            <span>
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleAirdropClick}
                                    disabled={airdropDisabled}
                                    startIcon={airdropping ? <CircularProgress size={18} /> : null}
                                >
                                    {airdropping
                                        ? (translatables?.texts?.airdropping ?? 'Airdropping...')
                                        : (translatables?.texts?.airdrop_selected ?? `Airdrop (${selectedStudentIds.length})`)}
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Grid>
            </Grid>

            {/* Status alerts */}
            {!hasRewards ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {translatables?.texts?.no_rewards_configured ??
                        'No rewards are configured for this course. Enable certificates or token rewards in course settings.'}
                </Alert>
            ) : !hasStudents ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {translatables?.texts?.no_students ??
                        'No students have completed this course yet.'}
                </Alert>
            ) : !hasEligibleStudents ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {translatables?.texts?.no_eligible_students ??
                        'No students are currently eligible. Students must complete the course and pass all exams.'}
                </Alert>
            ) : null}

            {hasStudents && (
                <Box>
                    <CertificateTable
                        students={students}
                        selectedStudentIds={selectedStudentIds}
                        onToggleSelect={handleToggleSelect}
                        translatables={translatables}
                        explorerUrl={explorerUrl}
                        hasRewards={hasRewards}
                    />
                </Box>
            )}

            {/* Fee dialog */}
            <AirdropFeeDialog
                open={feeDialogOpen}
                loading={feeLoading}
                feeData={feeData}
                onConfirm={handleFeeConfirm}
                onClose={() => setFeeDialogOpen(false)}
                translatables={translatables}
            />

            {/* Results dialog */}
            <AirdropResultsDialog
                open={resultsDialogOpen}
                results={airdropResults}
                onClose={() => setResultsDialogOpen(false)}
                onRetryFailed={handleRetryFailed}
                translatables={translatables}
            />
        </>
    )
}

export default Certificates
