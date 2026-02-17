import { usePage } from "@inertiajs/inertia-react"
import { Alert, Box, Button, CircularProgress, Grid, Typography } from "@mui/material"
import { useState } from "react"
import { Inertia } from "@inertiajs/inertia"
import CertificateTable from "./components/CertificateTable"

const Certificates = () => {
    const { course, students, translatables, explorerUrl } = usePage().props

    // Track minting state for individual students
    const [minting, setMinting] = useState({})

    // Track batch minting state
    const [batchMinting, setBatchMinting] = useState(false)

    /**
     * Handle minting certificate for a single student
     */
    const handleMintCertificate = (studentId) => {
        // Set minting state for this student
        setMinting(prev => ({ ...prev, [studentId]: true }))

        Inertia.post(`/api/certificates/courses/${course.id}/students/${studentId}/mint`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                // Success feedback handled by Inertia flash messages
                console.log('Certificate minted successfully for student:', studentId)
            },
            onError: (errors) => {
                // Error feedback
                console.error('Failed to mint certificate:', errors)
            },
            onFinish: () => {
                // Always clear minting state
                setMinting(prev => {
                    const newState = { ...prev }
                    delete newState[studentId]
                    return newState
                })
            }
        })
    }

    /**
     * Handle retrying a failed mint
     */
    const handleRetryMint = (studentId) => {
        handleMintCertificate(studentId)
    }

    /**
     * Handle batch minting for all eligible students
     */
    const handleBatchMint = () => {
        // Get all eligible students (not already minted or minting)
        const eligibleStudentIds = students
            .filter(student => student.certificate_status === 'eligible')
            .map(student => student.id)

        if (eligibleStudentIds.length === 0) {
            return
        }

        setBatchMinting(true)

        Inertia.post(`/api/certificates/courses/${course.id}/batch-mint`, {
            student_ids: eligibleStudentIds
        }, {
            preserveScroll: true,
            onSuccess: () => {
                console.log('Batch minting completed')
            },
            onError: (errors) => {
                console.error('Batch minting failed:', errors)
            },
            onFinish: () => {
                setBatchMinting(false)
            }
        })
    }

    // Calculate eligible students count
    const eligibleCount = students.filter(s => s.certificate_status === 'eligible').length
    const hasEligibleStudents = eligibleCount > 0
    const hasStudents = students && students.length > 0

    return (
        <>
            <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md="auto">
                    <Typography variant="h5">
                        {translatables.texts.certificates || 'Completion Certificates'}
                    </Typography>
                </Grid>
                {hasEligibleStudents && (
                    <Grid item xs={12} md="auto">
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleBatchMint}
                            disabled={batchMinting}
                            startIcon={batchMinting ? <CircularProgress size={20} /> : null}
                            sx={{ width: { xs: '100%', md: 'auto' } }}
                        >
                            {batchMinting
                                ? (translatables.texts.minting_all || 'Minting All...')
                                : (translatables.texts.mint_all_eligible || `Mint All Eligible (${eligibleCount})`)}
                        </Button>
                    </Grid>
                )}
            </Grid>

            {!course.certificate_enabled ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {translatables.texts.certificates_not_enabled ||
                        'Certificates are not enabled for this course. Enable them in course settings to mint completion certificates for students.'}
                </Alert>
            ) : !hasStudents ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {translatables.texts.no_students ||
                        'No students have enrolled in this course yet.'}
                </Alert>
            ) : !hasEligibleStudents ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {translatables.texts.no_eligible_students ||
                        'No students are currently eligible for certificates. Students must complete the course and pass all exams to be eligible.'}
                </Alert>
            ) : null}

            {hasStudents && (
                <Box>
                    <CertificateTable
                        students={students}
                        onMint={handleMintCertificate}
                        onRetry={handleRetryMint}
                        minting={minting}
                        translatables={translatables}
                        explorerUrl={explorerUrl}
                    />
                </Box>
            )}
        </>
    )
}

export default Certificates
