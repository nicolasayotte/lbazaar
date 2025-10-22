<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseSchedule;
use App\Models\User;
use App\Repositories\CourseScheduleRepository;
use App\Repositories\CourseRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TopPageController extends Controller
{
    public function index()
    {
        $courseRepository = new CourseRepository();
        $courseScheduleRepository = new CourseScheduleRepository();
        $userRepository = new UserRepository();

        $featuredTeachers = $userRepository->getFeaturedTeachers(User::FEATURED_TEACHERS_COUNT_DISPLAY);
        $featuredClasses = $courseRepository->getFeaturedClass(Course::FEATURED_CLASS_COUNT_DISPLAY);
        $featuredCourseSchedule = $courseScheduleRepository->getUpcomingCourseSchedule(CourseSchedule::COMING_SOON_COUNT_DISPLAY);

        return Inertia::render('Portal/TopPage', [
                'courses'           => $featuredClasses,
                'upcomingCourses'   => $featuredCourseSchedule,
                'teachers'          => $featuredTeachers,
                'title'             => 'Welcome to LE BAZAAR',
            ])->withViewData([
                'title'       => 'Welcome to LE BAZAAR',
                'description' => 'Top page Screen'
            ]);
    }

    public function setLanguage($locale)
    {
        session()->put('locale', $locale);
        app()->setLocale($locale);

        return redirect()->back();
    }
}
