<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeedbackRequest;
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

    public function create($course_id, $schedule_id)
    {
        if (!Auth::user()->isCourseBooked($course_id))
        {
            return redirect()->route('course.details', ['id' => $course_id]);
        }

        return Inertia::render('Portal/CourseFeedback', [
            'course'     => $this->courseRepository->findOrFail($course_id)->load('professor'),
            'schedule'   => $this->courseScheduleRepository->findOrFail($schedule_id),
            'feedback'   => $this->courseFeedbackRepository->findByUserAndCourseID(Auth::user()->id, $course_id),
            'title'      => getTranslation('title.feedbacks'),
            'return_url' => route('course.attend.index', ['course_id' => $course_id, 'schedule_id' => $schedule_id])
        ])->withViewData([
            'title'      => getTranslation('title.feedbacks')
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

    public function edit($id)
    {
        $feedback = $this->courseFeedbackRepository->with(['course'])->findOrFail($id);

        if (!auth()->user() || auth()->user()->id != $feedback->user_id) {
            return redirect()->back()->with('error', getTranslation('error'));
        }

        return Inertia::render('Portal/CourseFeedback', [
            'course'     => $feedback->course,
            'feedback'   => $feedback,
            'title'      => getTranslation('title.feedbacks'),
            'return_url' => route('course.details', ['id' => $feedback->course_id])
        ])->withViewData([
            'title'      => getTranslation('title.feedbacks')
        ]);
    }

    public function update($id, FeedbackRequest $request)
    {
        $feedback = $this->courseFeedbackRepository->findOrFail($id);

        $feedback->update($request->all());

        return to_route('course.details', ['id' => $feedback->course_id])->with('success', getTranslation('success.feedback'));
    }
}
