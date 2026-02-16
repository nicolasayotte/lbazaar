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

        return Inertia::render('Portal/MyPage/ManageClass/Certificates', [
            'course'    => $this->courseRepository->findByIdManageClass($id),
            'students'  => $students,
            'tabValue'  => 'certificates',
            'courseId'  => (int) $id,
            'title'     => $this->baseTitle . getTranslation('title.certificates')
        ])->withViewData([
            'title'     => $this->baseTitle . getTranslation('title.certificates'),
        ]);
    }

    /**
     * Get completed students with certificate status
     *
     * @param int $courseId
     * @return array
     */
    protected function getCompletedStudents($courseId)
    {
        $completedHistories = CourseHistory::where('course_id', $courseId)
            ->whereNotNull('completed_at')
            ->with(['user', 'user.userWallet', 'courseSchedule'])
            ->get();

        return $completedHistories->map(function ($history) {
            // Determine certificate status
            $certificateStatus = $history->certificate_status;

            // If no status set, determine if eligible
            if (!$certificateStatus) {
                $certificateStatus = $this->hasPassedAllExams($history->user->id, $history->course_schedule_id)
                    ? 'eligible'
                    : 'failed';
            }

            return [
                'id' => $history->user->id,
                'name' => $history->user->fullname ?? $history->user->name,
                'email' => $history->user->email,
                'wallet_address' => $history->user->userWallet->address ?? null,
                'completed_at' => $history->completed_at,
                'certificate_status' => $certificateStatus,
                'certificate_tx_hash' => $history->certificate_tx_hash,
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
