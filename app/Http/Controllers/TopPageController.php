<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\User;
use App\Repositories\CourseContentRepository;
use App\Repositories\CourseRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TopPageController extends Controller
{
    public function index()
    {
        $courseRepository = new CourseRepository();
        $courseContentRepository = new CourseContentRepository();
        $userRepository = new UserRepository();

        $featuredTeachers = $userRepository->getFeaturedTeacher(3);
        $featuredClasses = $courseRepository->getFeaturedClass(3);
        $featuredCourseContent = $courseContentRepository->getUpcomingCourseContent(4);

        return Inertia::render('TopPage', [
                'courses'           => $featuredClasses,
                'upcomingCourses'   => $featuredCourseContent,
                'teachers'          => $featuredTeachers
            ])->withViewData([
                'title'       => 'Laravel',
                'description' => 'Top page Screen'
            ]);
    }
}
