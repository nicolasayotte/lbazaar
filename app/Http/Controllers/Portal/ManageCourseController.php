<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseUpdateRequest;
use App\Models\Course;
use App\Models\CourseHistory;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\NftRepository;
use App\Repositories\CourseFeedbackRepository;
use App\Repositories\CourseHistoryRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ManageCourseController extends Controller
{
    public $courseTypeRepository;
    public $courseCategoryRepository;
    public $nftRepository;
    public $courseRepository;
    public $courseHistoryRepository;
    public $courseFeedbackRepository;
    public $userRepository;
    public $baseTitle;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
        $this->courseCategoryRepository = new CourseCategoryRepository();
        $this->nftRepository = new NftRepository();
        $this->courseRepository = new CourseRepository();
        $this->courseHistoryRepository = new CourseHistoryRepository();
        $this->courseFeedbackRepository = new CourseFeedbackRepository();
        $this->userRepository = new UserRepository();

        $this->baseTitle = getTranslation('title.class.manage.view') . ' | ';
    }

    public function index(Request $request)
    {
        return Inertia::render('Portal/MyPage/ManageClass/Index', [
            'courses'         => $this->courseRepository->getMyCourses($request->all()),
            'categoryOptions' => $this->courseCategoryRepository->getDropdownData(),
            'nftOptions'      => $this->nftRepository->getDropdownData(),
            'typeOptions'     => $this->courseTypeRepository->getDropdownData(),
            'keyword'         => @$request['keyword'] ?? '',
            'course_type'     => @$request['course_type'] ?? '',
            'category'        => @$request['category'] ?? '',
            'format'          => @$request['format'] ?? '',
            'sort'            => @$request['sort'] ?? 'courses.created_at:desc',
            'page'            => @$request['page'] ?? 1,
            'title'           => getTranslation('texts.mypage') . ' | ' . getTranslation('title.class.manage.view')
        ])->withViewData([
            'title'           => getTranslation('texts.mypage') . ' | ' . getTranslation('title.class.manage.view'),
        ]);
    }

    public function feedbacks($id, Request $request)
    {
        $feedbacks = $this->courseFeedbackRepository->findByCourseIdAndSearch($id, $request->all());

        return Inertia::render('Portal/MyPage/ManageClass/Feedbacks', [
            'course'    => $this->courseRepository->findByIdManageClass($id),
            'feedbacks' => $feedbacks,
            'tabValue'  => 'feedbacks',
            'keyword'   => @$request['keyword'] ?? '',
            'sort'      => @$request['sort'] ?? 'created_at:desc',
            'page'      => @$request['page'] ?? 1,
            'courseId'  => $id,
            'title'     => $this->baseTitle . getTranslation('title.feedbacks')
        ])->withViewData([
            'title'     => $this->baseTitle . getTranslation('title.feedbacks'),
        ]);
    }

    public function certificates($id, Request $request)
    {
        // Verify teacher owns the course
        $course = Course::where('id', $id)
            ->where('professor_id', Auth::id())
            ->firstOrFail();

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
            'title'                => $this->baseTitle . getTranslation('title.certificates'),
        ])->withViewData([
            'title' => $this->baseTitle . getTranslation('title.certificates'),
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
     *
     * @param int $courseId
     * @return array
     */
    protected function getCompletedStudents($courseId)
    {
        $completedHistories = CourseHistory::where('course_id', $courseId)
            ->whereNotNull('completed_at')
            ->with(['user', 'courseSchedule'])
            ->get();

        return $completedHistories->map(function ($history) {
            $certificateStatus = $history->certificate_status;

            // Derive delivery_status from certificate_status + exam pass check
            if ($certificateStatus === 'minted') {
                $deliveryStatus = 'delivered';
            } elseif ($certificateStatus === 'self_minted') {
                $deliveryStatus = 'self_minted';
            } elseif ($certificateStatus === 'failed') {
                $deliveryStatus = 'failed';
            } else {
                // null / other: eligible only when passed all exams
                $passed = $this->hasPassedAllExams(
                    $history->user->id,
                    $history->course_schedule_id
                );
                $deliveryStatus = $passed ? 'eligible' : 'not_eligible';

                // Sync certificate_status so legacy code still works
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
     * Check if a student has passed all exams for a specific course schedule
     *
     * @param int $studentId
     * @param int $scheduleId
     * @return bool
     */
    protected function hasPassedAllExams($studentId, $scheduleId)
    {
        // Get total exams for this schedule
        $totalExams = \App\Models\UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->count();

        // Get passed exams for this schedule
        $passedExams = \App\Models\UserExam::where('user_id', $studentId)
            ->where('course_schedule_id', $scheduleId)
            ->where('is_passed', 1)
            ->count();

        // If no exams exist, consider it as passed (some courses might not have exams)
        if ($totalExams === 0) {
            return true;
        }

        // All exams must be passed
        return $totalExams === $passedExams;
    }
}
