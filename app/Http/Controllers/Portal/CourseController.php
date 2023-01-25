<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchClassRequest;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseContentRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\UserRepository;
use Inertia\Inertia;

class CourseController extends Controller
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

    public function index(SearchClassRequest $request)
    {
        $languages = $this->courseRepository->getLanguages();
        $types = $this->courseTypeRepository->getAll();
        $categories = $this->courseCategoryRepository->getAll();
        $teachers = $this->userRepository->getAllTeachers();

        $courses = $this->courseRepository->search($request);

        return Inertia::render('Portal/Course/Search', [
                'course_types'          => $types,
                'course_categories'     => $categories,
                'languages'             => $languages,
                'teachers'              => $teachers,
                'courses'               => $courses,
                'page'                  => @$request['page'] ?? 1,
                'month'                 => @$request['month'] ?? '',
                'search_text'           => @$request['search_text'] ?? '',
                'category_id'           => @$request['category_id'] ?? '',
                'type_id'               => @$request['type_id'] ?? '',
                'status'                => @$request['status'] ?? '',
                'language'              => @$request['language'] ?? '',
                'professor_id'          => @$request['professor_id'] ?? '',
                'title'                 => 'Browse Courses'
            ])->withViewData([
                'title'       => 'Browse Courses',
                'description' => 'Course Lists'
            ]);
    }

    public function details($id)
    {
        $course = $this->courseRepository->findById($id);
        $contents = $this->courseContentRepository->findByCourseId($course->id);

        return Inertia::render('Portal/Course/Details', [
            'course'            => $course,
            'contents'          => $contents,
            'isBooked'          => auth()->user() && auth()->user()->isCourseBooked($id),
            'hasFeedback'       => auth()->user() && auth()->user()->hasFeedback($id),
            'title'             => 'Course - ' . $course->title,
        ])->withViewData([
            'title'       => 'Course - ' . $course->title,
            'description' => 'Course Details'
        ]);
    }
}
