<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminBatchMintCertificatesRequest;
use App\Http\Requests\AdminEstimateAirdropFeeRequest;
use App\Http\Requests\AdminGetCertificateStatusRequest;
use App\Http\Requests\AdminGetEligibleStudentsRequest;
use App\Http\Requests\AdminMintSingleCertificateRequest;
use App\Models\Course;
use App\Models\User;
use App\Services\API\CertificateService;
use App\Services\API\TokenRewardService;
use Exception;
use Illuminate\Support\Facades\Log;

class CertificateController extends Controller
{
    protected CertificateService $certificateService;
    protected ?TokenRewardService $tokenRewardService;

    public function __construct(CertificateService $certificateService)
    {
        $this->certificateService = $certificateService;

        $this->tokenRewardService = class_exists(TokenRewardService::class)
            ? app(TokenRewardService::class)
            : null;
    }

    /**
     * Estimate total ADA cost for an admin airdrop.
     * Uses PHP_INT_MAX as wallet balance — platform wallet is never insufficient.
     */
    public function estimateAirdropFee(AdminEstimateAirdropFeeRequest $request, Course $course): \Illuminate\Http\JsonResponse
    {
        $studentIds         = $request->input('student_ids');
        $includeCertificate = (bool) $course->certificate_enabled;
        $includeToken       = !empty($course->token_reward_enabled);

        $result = $this->certificateService->estimateAirdropFee(
            $course,
            count($studentIds),
            $includeCertificate,
            $includeToken,
            PHP_INT_MAX
        );

        // Override: platform wallet is never insufficient
        if (isset($result['data'])) {
            $result['data']['fee_payer']   = 'platform';
            $result['data']['insufficient'] = false;
        }

        return response()->json($result, 200);
    }

    /**
     * Get eligible students for certificate minting for any course.
     */
    public function getEligibleStudents(AdminGetEligibleStudentsRequest $request, Course $course): \Illuminate\Http\JsonResponse
    {
        try {
            $result = $this->certificateService->getEligibleStudentsWithStatus($course);

            return response()->json($result, $result['success'] ? 200 : 400);

        } catch (Exception $e) {
            Log::error('Admin: failed to get eligible students', [
                'course_id' => $course->id,
                'error'     => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve eligible students: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Mint certificate for a single student on any course.
     */
    public function mintSingleCertificate(AdminMintSingleCertificateRequest $request, Course $course, User $student): \Illuminate\Http\JsonResponse
    {
        try {
            $result = $this->certificateService->mintAndAirdropCertificate($course, $student);

            return response()->json($result, $result['success'] ? 200 : 400);

        } catch (Exception $e) {
            Log::error('Admin: failed to mint single certificate', [
                'course_id'  => $course->id,
                'student_id' => $student->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to mint certificate: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Batch mint certificates for multiple students on any course.
     */
    public function batchMintCertificates(AdminBatchMintCertificatesRequest $request, Course $course): \Illuminate\Http\JsonResponse
    {
        $studentIds   = $request->input('student_ids');
        $results      = [];
        $successCount = 0;
        $failureCount = 0;

        foreach ($studentIds as $studentId) {
            try {
                $student = User::findOrFail($studentId);

                $result = $this->certificateService->mintAndAirdropCertificate($course, $student);

                $results[] = [
                    'student_id'     => $student->id,
                    'student_name'   => $student->fullname,
                    'success'        => $result['success'],
                    'message'        => $result['message'],
                    'transaction_id' => $result['transaction_id'] ?? null,
                ];

                if ($result['success']) {
                    $successCount++;
                } else {
                    $failureCount++;
                }

            } catch (Exception $e) {
                $failureCount++;
                $results[] = [
                    'student_id'     => $studentId,
                    'student_name'   => null,
                    'success'        => false,
                    'message'        => 'Failed to mint certificate: ' . $e->getMessage(),
                    'transaction_id' => null,
                ];

                Log::error('Admin: batch mint failed for student', [
                    'course_id'  => $course->id,
                    'student_id' => $studentId,
                    'error'      => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Batch minting completed. Success: {$successCount}, Failed: {$failureCount}",
            'data'    => [
                'total_processed' => count($studentIds),
                'success_count'   => $successCount,
                'failure_count'   => $failureCount,
                'results'         => $results,
            ],
        ], 200);
    }

    /**
     * Get certificate status for a specific student in any course.
     */
    public function getCertificateStatus(AdminGetCertificateStatusRequest $request, Course $course, User $student): \Illuminate\Http\JsonResponse
    {
        try {
            $result = $this->certificateService->getCertificateStatusForStudent($course, $student);

            return response()->json($result, $result['success'] ? 200 : 400);

        } catch (Exception $e) {
            Log::error('Admin: failed to get certificate status', [
                'course_id'  => $course->id,
                'student_id' => $student->id,
                'error'      => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve certificate status: ' . $e->getMessage(),
            ], 500);
        }
    }
}
