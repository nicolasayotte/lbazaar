<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Repositories\CourseRepository;
use Inertia\Inertia;

class ManageCertificateController extends Controller
{
    protected CourseRepository $courseRepository;

    public function __construct()
    {
        $this->courseRepository = new CourseRepository();
    }

    /**
     * Display the certificates roster for any course (no professor_id filter).
     */
    public function certificates(int $id): \Inertia\Response
    {
        $course = Course::findOrFail($id);

        $students = $this->getCompletedStudents($id);

        $hasRewards = !empty($course->certificate_enabled)
            || !empty($course->token_reward_enabled);

        return Inertia::render('Portal/MyPage/ManageClass/Certificates', [
            'course'               => $this->courseRepository->findByIdManageClass($id),
            'students'             => $students,
            'tabValue'             => 'certificates',
            'courseId'             => (int) $id,
            'explorerUrl'          => config('services.cardano.explorer_url'),
            'has_rewards'          => $hasRewards,
            'token_reward_enabled' => !empty($course->token_reward_enabled),
            'title'                => 'Admin | Certificates',
        ])->withViewData([
            'title' => 'Admin | Certificates',
        ]);
    }

    /**
     * Get completed students with certificate status and delivery status.
     *
     * delivery_status values:
     *   - eligible      : completed + passed all exams, certificate not yet minted
     *   - delivered     : certificate_status = 'minted'
     *   - self_minted   : certificate_status = 'self_minted'
     *   - failed        : certificate_status = 'failed'
     *   - not_eligible  : completed but did not pass all exams, or not completed
     */
    protected function getCompletedStudents(int $courseId): array
    {
        $completedHistories = CourseHistory::where('course_id', $courseId)
            ->whereNotNull('completed_at')
            ->with(['user', 'courseSchedule'])
            ->get();

        return $completedHistories->map(function ($history) {
            $certificateStatus = $history->certificate_status;

            if ($certificateStatus === 'minted') {
                $deliveryStatus = 'delivered';
            } elseif ($certificateStatus === 'self_minted') {
                $deliveryStatus = 'self_minted';
            } elseif ($certificateStatus === 'failed') {
                $deliveryStatus = 'failed';
            } else {
                $passed = $this->hasPassedAllExams(
                    $history->user->id,
                    $history->course_schedule_id
                );
                $deliveryStatus = $passed ? 'eligible' : 'not_eligible';

                if (!$certificateStatus) {
                    $certificateStatus = $passed ? 'eligible' : 'not_eligible';
                }
            }

            $completionStatus = $history->completed_at ? 'completed' : 'in_progress';

            return [
                'id'                    => $history->user->id,
                'name'                  => $history->user->fullname ?? $history->user->name,
                'email'                 => $history->user->email,
                'completed_at'          => $history->completed_at,
                'completion_status'     => $completionStatus,
                'delivery_status'       => $deliveryStatus,
                'certificate_status'    => $certificateStatus,
                'certificate_tx_hash'   => $history->certificate_tx_hash,
                'certificate_minted_at' => $history->certificate_minted_at,
            ];
        })->toArray();
    }

    /**
     * Check if a student has passed all exams for a specific course schedule.
     */
    protected function hasPassedAllExams(int $studentId, ?int $scheduleId): bool
    {
        if ($scheduleId === null) {
            return true;
        }

        $totalExams = \App\Models\UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->count();

        if ($totalExams === 0) {
            return true;
        }

        $passedExams = \App\Models\UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->where('is_passed', 1)
            ->count();

        return $totalExams === $passedExams;
    }
}
