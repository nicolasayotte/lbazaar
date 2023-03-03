<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeedbackRequest;
use App\Models\CourseFeedback;
use App\Repositories\CourseFeedbackRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseScheduleRepository;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CourseFeedbackController extends Controller
{
    private $courseFeedbackRepository;

    private $courseRepository;

    private $courseScheduleRepository;

    public function __construct()
    {
        $this->courseFeedbackRepository = new CourseFeedbackRepository;
        $this->courseRepository = new CourseRepository;
        $this->courseScheduleRepository = new CourseScheduleRepository;
    }

    public function index($course_id, $schedule_id)
    {
        if (!Auth::user()->isCourseBooked($course_id))
        {
            return redirect()->route('course.details', ['id' => $course_id]);
        }

        return Inertia::render('Portal/CourseFeedback', [
            'course'    => $this->courseRepository->findOrFail($course_id)->load('professor'),
            'schedule'  => $this->courseScheduleRepository->findOrFail($schedule_id),
            'feedback'  => $this->courseFeedbackRepository->findByUserAndCourseID(Auth::user()->id, $course_id),
            'title'     => 'Class Feedback'
        ])->withViewData([
            'title'     => 'Class Feedback'
        ]);
    }

    public function store($course_id, $schedule_id, FeedbackRequest $request)
    {
        try {
            $this->courseFeedbackRepository->updateOrCreate(Auth::user()->id, $course_id, $request->all());
        } catch (Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }

        return to_route('course.attend.index', ['course_id' => $course_id, 'schedule_id' => $schedule_id])->with([
            'success',
            getTranslation('success.feedback')
        ]);
    }
}
