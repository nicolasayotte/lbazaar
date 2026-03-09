import { Inertia } from '@inertiajs/inertia'
import { usePage } from '@inertiajs/inertia-react'
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material'
import { useState } from 'react'
import axios from 'axios'
import CertificateTable from './components/CertificateTable'
import AirdropResultsDialog from './components/AirdropResultsDialog'

const Certificates = () => {
    const {
        course,
        students,
        translatables,
        explorerUrl,
        has_rewards: hasRewards,
        certificatePolicyId,
        certificateLockDate,
    } = usePage().props

    // Selection state
    const [selectedStudentIds, setSelectedStudentIds] = useState([])

    // Airdrop process state
    const [airdropping, setAirdropping] = useState(false)

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false)

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

    const handleAirdropClick = () => {
        if (selectedStudentIds.length === 0) return
        setConfirmOpen(true)
    }

    const handleConfirmAirdrop = async () => {
        setConfirmOpen(false)
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
                    reason: err?.response?.data?.message ?? 'Airdrop request failed',
                })),
            })
            setResultsDialogOpen(true)
        } finally {
            setAirdropping(false)
        }
    }

    const handleResultsClose = () => {
        setResultsDialogOpen(false)
        setSelectedStudentIds([])
        // Reload page to refresh student statuses
        Inertia.reload()
    }

    const handleRetryFailed = (failedIds) => {
        setResultsDialogOpen(false)
        setSelectedStudentIds(failedIds)
        setConfirmOpen(true)
    }

    const noSelection = selectedStudentIds.length === 0
    const airdropDisabled = noSelection || airdropping

    const airdropTooltip = noSelection
        ? (translatables?.texts?.select_students_to_airdrop ?? 'Select students to airdrop')
        : null

    return (
        <>
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

            {/* Certificate policy info */}
            {certificatePolicyId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        <strong>Policy ID:</strong> {certificatePolicyId}
                    </Typography>
                    {certificateLockDate && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <strong>Lock date:</strong> {new Date(certificateLockDate).toLocaleDateString()}
                        </Typography>
                    )}
                </Alert>
            )}

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

            {/* Confirm dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {translatables?.texts?.confirm_airdrop_title ?? 'Confirm Airdrop'}
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        {(translatables?.texts?.confirm_airdrop_body ??
                            'Mint and airdrop certificates to {count} selected student(s)?')
                            .replace('{count}', selectedStudentIds.length)}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>
                        {translatables?.texts?.cancel ?? 'Cancel'}
                    </Button>
                    <Button variant="contained" color="success" onClick={handleConfirmAirdrop}>
                        {translatables?.texts?.confirm ?? 'Confirm'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Results dialog */}
            <AirdropResultsDialog
                open={resultsDialogOpen}
                results={airdropResults}
                onClose={handleResultsClose}
                onRetryFailed={handleRetryFailed}
                translatables={translatables}
            />
        </>
    )
}

export default Certificates
