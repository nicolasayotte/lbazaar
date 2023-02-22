<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseScheduleRequest;
use App\Models\CourseSchedule;
use App\Models\Role;
use App\Repositories\CourseRepository;
use App\Repositories\CourseScheduleRepository;
use App\Repositories\TranslationRepository;
use Carbon\Carbon;
use DateTime;
use DateTimeZone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseScheduleController extends Controller
{
    private $courseRepository;

    private $courseScheduleRepository;

    private $baseTitle;

    public function __construct()
    {
        $this->courseRepository         = new CourseRepository();
        $this->courseScheduleRepository = new CourseScheduleRepository();

        $this->baseTitle = TranslationRepository::getTranslation('title.class.manage.view') . ' - ';
    }

    public function index($id, Request $request)
    {
        return Inertia::render('Portal/MyPage/ManageClass/Schedules', [
            'course'    => $this->courseRepository->findByIdManageClass($id),
            'schedules' => $this->courseScheduleRepository->get($id, $request),
            'month'     => @$request['month'] ?? '',
            'page'      => @$request['page'] ?? 1,
            'sort'      => @$request['sort'] ?? 'start_datetime:asc',
            'status'    => @$request['status'] ?? '',
            'title'     => $this->baseTitle . getTranslation('title.schedules.index'),
            'tabValue'  => 'schedules'
        ])->withViewData([
            'title'     => $this->baseTitle . getTranslation('title.schedules.index')
        ]);
    }

    public function view($id, Request $request)
    {
        $courseSchedule = $this->courseScheduleRepository->with(['course', 'course.exams'])->findOrFail($id);

        return Inertia::render('Portal/CourseSchedules/View', [
            'course'   => @$courseSchedule->course,
            'schedule' => @$courseSchedule,
            'students' => $this->courseScheduleRepository->getStudents($id, $request->all()),
            'page'     => @$request['page'] ?? 1,
            'sort'     => @$request['sort'] ?? 'fullname:asc',
            'keyword'  => @$request['keyword'] ?? '',
            'title'    => $this->baseTitle . getTranslation('title.schedules.view')
        ])->withViewData([
            'title'    => $this->baseTitle . getTranslation('title.schedules.view')
        ]);
    }

    public function create($id)
    {
        $title = $this->baseTitle .= TranslationRepository::getTranslation('title.schedules.create');

        return Inertia::render('Portal/CourseSchedules/Create', [
            'course'       => $this->courseRepository->findByIdManageClass($id),
            'current_date' => Carbon::parse(new DateTime('now', new DateTimeZone(env('APP_TIMEZONE')))),
            'title'        => $this->baseTitle . getTranslation('title.schedules.create')
        ])->withViewData(([
            'title'        => $this->baseTitle . getTranslation('title.schedules.create')
        ]));
    }

    public function store($id, CourseScheduleRequest $request)
    {
        $course = $this->courseRepository->findOrFail($id);

        $inputs = $request->all();

        $inputs['end_datetime'] = Carbon::parse($inputs['start_datetime'])->addDays(7);

        $course->schedules()->create($inputs);

        return to_route('mypage.course.manage_class.schedules', ['id' => $id])->with('success', TranslationRepository::getTranslation('success.schedules.create'));
    }

    public function delete($id)
    {
        $courseSchedule = $this->courseScheduleRepository->findOrFail($id);

        $courseSchedule->delete();

        return redirect()->back()->with('success', TranslationRepository::getTranslation('success.schedules.delete'));
    }
}
