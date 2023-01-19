<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchClassRequest;
use App\Models\Course;
use App\Models\CourseContent;
use App\Models\User;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseContentRepository;
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
    public $courseRepository;
    public $courseContentRepository;
    public $userRepository;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
        $this->courseCategoryRepository = new CourseCategoryRepository();
        $this->courseRepository = new CourseRepository();
        $this->courseContentRepository = new CourseContentRepository();
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
            'sort'               => @$request['sort'] ?? 'created_at:desc',
            'page'               => @$request['page'] ?? 1,
            'title'              => 'My Page | Class Application'
        ])->withViewData([
            'title'       => 'My Page | Manage Class',
        ]);
    }
}
