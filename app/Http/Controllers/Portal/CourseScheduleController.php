<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Repositories\CourseRepository;
use App\Repositories\CourseScheduleRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseScheduleController extends Controller
{
    private $courseRepository;

    private $courseScheduleRepository;

    public function __construct()
    {
        $this->courseRepository         = new CourseRepository();
        $this->courseScheduleRepository = new CourseScheduleRepository();
    }

    public function index($id, Request $request)
    {
        return Inertia::render('Portal/MyPage/ManageClass/Schedules', [
            'course'    => $this->courseRepository->findByIdManageClass($id),
            'schedules' => $this->courseScheduleRepository->get($id, $request),
            'keyword'   => @$request['keyword'] ?? '',
            'page'      => @$request['page'] ?? 1,
            'sort'      => @$request['sort'] ?? 'start_datetime:desc',
            'title'     => 'Manage Class - Schedules',
            'tabValue'  => 'schedules'
        ])->withViewData([
            'title'     => 'Manage Class - Schedules'
        ]);
    }
}
