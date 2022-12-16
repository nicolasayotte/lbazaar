<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchClassRequest;
use App\Models\Course;
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

        $courses = $courseContentRepository->search($request);
        $coursesTotal = count($courses);

        return Inertia::render('portal/SearchCourse', [
                'course_types'          => $types,
                'course_categories'     => $categories,
                'languages'             => $languages,
                'teachers'              => $teachers,
                'courses'               => $courses,
                'coursesTotal'          => $coursesTotal
            ])->withViewData([
                'title'       => 'Laravel',
                'description' => 'Top page Screen'
            ]);
    }
}
