<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseUpdateRequest;
use App\Models\CourseHistory;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\NftRepository;
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
}
