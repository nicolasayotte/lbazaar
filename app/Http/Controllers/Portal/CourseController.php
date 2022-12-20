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
    public function index(SearchClassRequest $request)
    {
        $courseTypeRepository = new CourseTypeRepository();
        $courseCategoryRepository = new CourseCategoryRepository();
        $courseRepository = new CourseRepository();
        $courseContentRepository = new CourseContentRepository();
        $userRepository = new UserRepository();

        $languages = $courseRepository->getLanguages();
        $types = $courseTypeRepository->getAll();
        $categories = $courseCategoryRepository->getAll();
        $teachers = $userRepository->getAllTeachers();

        $courses = $courseRepository->search($request);

        return Inertia::render('portal/course/Search', [
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
        $courseRepository = new CourseRepository();
        $courseContentRepository = new CourseContentRepository();

        $course = $courseRepository->findById($id);
        $contents = $courseContentRepository->findByCourseId($course->id);
        
        return Inertia::render('portal/course/Details', [
            'course'          => $course,
            'contents'        => $contents,
        ])->withViewData([
            'title'       => 'Course - ' . $course->title,
            'description' => 'Course Details'
        ]);
    }
}
