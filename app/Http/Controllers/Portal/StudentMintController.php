<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentSelfMintRequest;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Services\API\CertificateService;
use App\Services\API\TokenRewardService;
use Illuminate\Support\Facades\Log;

class StudentMintController extends Controller
{
    public function __construct(
        protected CertificateService $certificateService,
        protected TokenRewardService $tokenRewardService
    ) {
        $this->middleware('auth');
    }

    /**
     * Self-mint a certificate or token reward for an authenticated student.
     *
     * POST /classes/{course_id}/attend/{schedule_id}/self-mint
     */
    public function selfMint(StudentSelfMintRequest $request, int $course_id, int $schedule_id)
    {
        $student = auth()->user();

        // Verify student has a completed CourseHistory for this course/schedule
        $courseHistory = CourseHistory::where('user_id', $student->id)
            ->where('course_id', $course_id)
            ->where('course_schedule_id', $schedule_id)
            ->whereNotNull('completed_at')
            ->first();

        if (!$courseHistory) {
            return response()->json([
                'success' => false,
                'message' => 'Course not completed or enrollment not found.',
            ], 404);
        }

        $type = $request->input('type');

        if ($type === 'certificate') {
            return $this->handleCertificateMint($courseHistory, $course_id, $schedule_id, $student);
        }

        return $this->handleTokenMint($courseHistory, $course_id, $schedule_id, $student);
    }

    /**
     * Handle certificate self-mint.
     */
    protected function handleCertificateMint(
        CourseHistory $courseHistory,
        int $courseId,
        int $scheduleId,
        $student
    ) {
        // Guard: certificate must be enabled via enrollment-time snapshot
        if (!$courseHistory->effectiveCertificateEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Certificate is not enabled for this enrollment.',
            ], 403);
        }

        // Guard: certificate must not already be minted or self_minted
        $certStatus = $courseHistory->certificate_status ?? null;
        if (in_array($certStatus, ['minted', 'self_minted'], true)) {
            return response()->json([
                'success'        => false,
                'message'        => 'Certificate has already been minted.',
                'already_minted' => true,
            ], 409);
        }

        $course = Course::findOrFail($courseId);

        $result = $this->certificateService->mintAndAirdropCertificate(
            $course,
            $student,
            $scheduleId,
            $courseHistory
        );

        if (!$result['success']) {
            Log::warning('Student self-mint certificate failed', [
                'course_id'   => $courseId,
                'student_id'  => $student->id,
                'schedule_id' => $scheduleId,
                'message'     => $result['message'],
            ]);

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 500);
        }

        $explorerBase = config('services.cardano.explorer_url');
        $txHash       = $result['transaction_id'] ?? null;
        $explorerUrl  = ($txHash && $explorerBase) ? $explorerBase . '/tx/' . $txHash : null;

        return response()->json([
            'success'      => true,
            'message'      => 'Certificate minted successfully.',
            'tx_hash'      => $txHash,
            'explorer_url' => $explorerUrl,
        ]);
    }

    /**
     * Handle token reward self-mint.
     */
    protected function handleTokenMint(
        CourseHistory $courseHistory,
        int $courseId,
        int $scheduleId,
        $student
    ) {
        // Guard: token reward must be enabled via enrollment-time snapshot
        if (!$courseHistory->effectiveTokenRewardEnabled()) {
            return response()->json([
                'success' => false,
                'message' => 'Token reward is not enabled for this enrollment.',
            ], 403);
        }

        // Guard: token reward must not already be minted
        $tokenStatus = $courseHistory->token_reward_status ?? null;
        if ($tokenStatus === 'minted') {
            return response()->json([
                'success'        => false,
                'message'        => 'Token reward has already been minted.',
                'already_minted' => true,
            ], 409);
        }

        $course = Course::findOrFail($courseId);

        $result = $this->tokenRewardService->mintAndAirdropTokenReward(
            $course,
            $student,
            $scheduleId
        );

        if (!$result['success']) {
            Log::warning('Student self-mint token reward failed', [
                'course_id'   => $courseId,
                'student_id'  => $student->id,
                'schedule_id' => $scheduleId,
                'message'     => $result['message'],
            ]);

            return response()->json([
                'success' => false,
                'message' => $result['message'],
            ], 500);
        }

        $explorerBase = config('services.cardano.explorer_url');
        $txHash       = $result['transaction_id'] ?? null;
        $explorerUrl  = ($txHash && $explorerBase) ? $explorerBase . '/tx/' . $txHash : null;

        return response()->json([
            'success'      => true,
            'message'      => 'Token reward minted successfully.',
            'tx_hash'      => $txHash,
            'explorer_url' => $explorerUrl,
        ]);
    }
}
