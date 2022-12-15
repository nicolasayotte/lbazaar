<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
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
    public function index()
    {
        $courseTypeRepository = new CourseTypeRepository();
        $courseCategoryRepository = new CourseCategoryRepository();
        $courseRepository = new CourseRepository();
        $userRepository = new UserRepository();

        $languages = $courseRepository->getLanguages();
        $types = $courseTypeRepository->getAll();
        $categories = $courseCategoryRepository->getAll();
        $teachers = $userRepository->getAllTeachers();

        return Inertia::render('portal/SearchCourse', [
                'course_types'          => $types,
                'course_categories'     => $categories,
                'languages'             => $languages,
                'teachers'              => $teachers,
            ])->withViewData([
                'title'       => 'Laravel',
                'description' => 'Top page Screen'
            ]);
    }
}
