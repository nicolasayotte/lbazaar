<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseContent;
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

        $featuredTeachers = $userRepository->getFeaturedTeachers(User::FEATURED_TEACHERS_COUNT_DISPLAY);
        $featuredClasses = $courseRepository->getFeaturedClass(Course::FEATURED_CLASS_COUNT_DISPLAY);
        $featuredCourseContent = $courseContentRepository->getUpcomingCourseContent(CourseContent::COMING_SOON_COUNT_DISPLAY);

        return Inertia::render('Portal/TopPage', [
                'courses'           => $featuredClasses,
                'upcomingCourses'   => $featuredCourseContent,
                'teachers'          => $featuredTeachers,
                'title'             => 'Welcome to LE BAZAAR',
            ])->withViewData([
                'title'       => 'Welcome to LE BAZAAR',
                'description' => 'Top page Screen'
            ]);
    }
}
