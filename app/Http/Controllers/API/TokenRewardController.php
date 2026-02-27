<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\MintTokenRewardRequest;
use App\Http\Requests\UpdateTokenRewardRequest;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Models\UserExam;
use App\Services\API\TokenRewardService;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TokenRewardController extends Controller
{
    protected TokenRewardService $tokenRewardService;

    public function __construct(TokenRewardService $tokenRewardService)
    {
        $this->middleware('auth:sanctum');
        $this->tokenRewardService = $tokenRewardService;
    }

    /**
     * Update the token reward configuration for a course.
     * PUT /api/courses/{course}/token-reward
     */
    public function updateConfig(UpdateTokenRewardRequest $request, Course $course): \Illuminate\Http\JsonResponse
    {
        $result = $this->tokenRewardService->updateTokenRewardConfig(
            $course,
            (bool) $request->input('token_reward_enabled'),
            $request->input('token_reward_amount') !== null
                ? (int) $request->input('token_reward_amount')
                : null
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Mint and airdrop token rewards to eligible students.
     * POST /api/courses/{course}/token-reward/mint
     */
    public function mintAndAirdrop(MintTokenRewardRequest $request, Course $course): \Illuminate\Http\JsonResponse
    {
        try {
            $scheduleId = $request->input('schedule_id');

            $eligibleStudents = $this->getEligibleStudents($course->id, $scheduleId);

            if ($eligibleStudents->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No eligible students found for token reward minting.',
                    'data'    => ['course_id' => $course->id, 'eligible_students_count' => 0],
                ], 404);
            }

            $results      = [];
            $successCount = 0;
            $failureCount = 0;

            foreach ($eligibleStudents as $student) {
                try {
                    $result = $this->tokenRewardService->mintAndAirdropTokenReward(
                        $course, $student, $scheduleId
                    );

                    $results[] = [
                        'student_id'     => $student->id,
                        'student_name'   => $student->fullname,
                        'student_email'  => $student->email,
                        'success'        => $result['success'],
                        'transaction_id' => $result['transaction_id'] ?? null,
                        'wallet_address' => $result['wallet_address'] ?? null,
                        'message'        => $result['message'] ?? null,
                    ];

                    $result['success'] ? $successCount++ : $failureCount++;

                } catch (Exception $e) {
                    $failureCount++;
                    $results[] = [
                        'student_id'     => $student->id,
                        'student_name'   => $student->fullname,
                        'student_email'  => $student->email,
                        'success'        => false,
                        'transaction_id' => null,
                        'wallet_address' => null,
                        'message'        => 'Failed to mint token reward: ' . $e->getMessage(),
                    ];

                    Log::error('Token reward minting failed for student', [
                        'course_id'  => $course->id,
                        'student_id' => $student->id,
                        'error'      => $e->getMessage(),
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Token reward minting completed. Success: {$successCount}, Failed: {$failureCount}",
                'data'    => [
                    'course_id'               => $course->id,
                    'course_title'            => $course->title,
                    'total_eligible_students' => $eligibleStudents->count(),
                    'success_count'           => $successCount,
                    'failure_count'           => $failureCount,
                    'results'                 => $results,
                ],
            ], 200);

        } catch (Exception $e) {
            Log::error('Token reward mint API error', [
                'error'   => $e->getMessage(),
                'course'  => $course->id,
                'teacher' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while minting token rewards: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get eligible students (completed course, not cancelled, all exams passed, no token reward yet).
     */
    protected function getEligibleStudents(int $courseId, ?int $scheduleId): \Illuminate\Support\Collection
    {
        $query = CourseHistory::with(['user', 'user.userWallet', 'courseSchedule'])
            ->where('course_id', $courseId)
            ->whereNotNull('completed_at')
            ->where(function ($q) {
                $q->where('is_cancelled', false)
                  ->orWhere('is_cancelled', 0)
                  ->orWhereNull('is_cancelled');
            })
            ->where(function ($q) {
                $q->whereNull('token_reward_status')
                  ->orWhere('token_reward_status', 'failed');
            });

        if ($scheduleId) {
            $query->where('course_schedule_id', $scheduleId);
        }

        $histories = $query->get();

        return $histories->filter(function ($history) {
            $student  = $history->user;
            $schedule = $history->courseSchedule;

            if (!$student || !$schedule) {
                return false;
            }

            $totalExams  = UserExam::where('user_id', $student->id)->where('course_schedule_id', $schedule->id)->count();
            $passedExams = UserExam::where('user_id', $student->id)->where('course_schedule_id', $schedule->id)->where('is_passed', 1)->count();

            return $totalExams === 0 || $totalExams === $passedExams;
        })->map(fn ($h) => $h->user)->unique('id');
    }
}
