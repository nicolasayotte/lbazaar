<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseUpdateRequest;
use App\Models\CourseHistory;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseFeedbackRepository;
use App\Repositories\CourseHistoryRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ManageCourseController extends Controller
{
    public $courseTypeRepository;
    public $courseCategoryRepository;
    public $courseRepository;
    public $courseHistoryRepository;
    public $courseFeedbackRepository;
    public $userRepository;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
        $this->courseCategoryRepository = new CourseCategoryRepository();
        $this->courseRepository = new CourseRepository();
        $this->courseHistoryRepository = new CourseHistoryRepository();
        $this->courseFeedbackRepository = new CourseFeedbackRepository();
        $this->userRepository = new UserRepository();
    }

    public function index(Request $request)
    {
        return Inertia::render('Portal/MyPage/ManageClass/Index', [
            'courses'            => $this->courseRepository->getMyCourses($request->all()),
            'categoryOptions'    => $this->courseCategoryRepository->getDropdownData(),
            'typeOptions'        => $this->courseTypeRepository->getDropdownData(),
            'keyword'            => @$request['keyword'] ?? '',
            'course_type'        => @$request['course_type'] ?? '',
            'category'           => @$request['category'] ?? '',
            'status'             => @$request['status'] ?? '',
            'sort'               => @$request['sort'] ?? 'course_schedules.start_datetime:desc',
            'page'               => @$request['page'] ?? 1,
            'title'              => 'My Page | Manage Class'
        ])->withViewData([
            'title'       => 'My Page | Manage Class',
        ]);
    }

    public function details($id, Request $request)
    {
        $course = $this->courseRepository->findByIdManageClass($id);
        return Inertia::render('Portal/MyPage/ManageClass/Details', [
            'course'            => $course,
            'categoryOptions'   => $this->courseCategoryRepository->getDropdownData(),
            'typeOptions'       => $this->courseTypeRepository->getDropdownData(),
            'tabValue'          => 'details',
            'title'             => 'My Page | Manage Class '
        ])->withViewData([
            'title'       => 'My Page | Manage Class - ' . $course["title"],
        ]);
    }

    public function students($id, Request $request)
    {
        $students = $this->courseHistoryRepository->searchEnrolledStudents($request, $id);
        return Inertia::render('Portal/MyPage/ManageClass/Students', [
            'students'          => $students,
            'tabValue'          => 'students',
            'keyword'           => @$request['keyword'] ?? '',
            'sort'              => @$request['sort'] ?? 'course_histories.created_at:desc',
            'page'              => @$request['page'] ?? 1,
            'courseId'          => $id,
            'title'             => 'My Page | Manage Class '
        ])->withViewData([
            'title'       => 'My Page | Manage Class - Students List',
        ]);
    }

    public function feedbacks($id, Request $request)
    {
        $feedbacks = $this->courseFeedbackRepository->findByCourseIdAndSearch($id, $request->all());

        return Inertia::render('Portal/MyPage/ManageClass/Feedbacks', [
            'feedbacks'         => $feedbacks,
            'tabValue'          => 'feedbacks',
            'keyword'           => @$request['keyword'] ?? '',
            'sort'              => @$request['sort'] ?? 'created_at:desc',
            'page'              => @$request['page'] ?? 1,
            'courseId'          => $id,
            'title'             => 'My Page | Manage Class '
        ])->withViewData([
            'title'       => 'My Page | Manage Class - Feedbacks',
        ]);
    }

    public function updateCompleted($id, $status)
    {
        $courseHistory = $this->courseHistoryRepository->findOrFail($id);

        $courseHistory->update(['completed_at' => $status == CourseHistory::COMPLETED ? new \DateTime() : null]);

        return redirect()->back();
    }

    public function updateCourse(CourseUpdateRequest $request)
    {
       return $this->courseRepository->courseUpdate($request);
    }
}
