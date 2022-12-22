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
use Inertia\Inertia;

class CourseController extends Controller
{
    public $courseTypeRepositoryl;
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
                'courses'               => $courses
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
            'course'          => $course,
            'contents'        => $contents,
        ])->withViewData([
            'title'       => 'Course - ' . $course->title,
            'description' => 'Course Details'
        ]);
    }
}
