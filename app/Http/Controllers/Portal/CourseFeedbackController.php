<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\FeedbackRequest;
use App\Models\CourseFeedback;
use App\Repositories\CourseFeedbackRepository;
use App\Repositories\CourseRepository;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CourseFeedbackController extends Controller
{
    private $courseFeedbackRepository;

    private $courseRepository;

    public function __construct()
    {
        $this->courseFeedbackRepository = new CourseFeedbackRepository;
        $this->courseRepository = new CourseRepository;
    }

    public function index($course_id)
    {
        if (!Auth::user()->isCourseBooked($course_id))
        {
            return redirect()->route('course.details', ['id' => $course_id]);
        }

        return Inertia::render('Portal/CourseFeedback', [
            'course'    => $this->courseRepository->findOrFail($course_id)->load('professor'),
            'feedback'  => $this->courseFeedbackRepository->findByUserAndCourseID(Auth::user()->id, $course_id)
        ])->withViewData([
            'title'     => 'Class Feedback'
        ]);
    }

    public function store($course_id, FeedbackRequest $request)
    {
        if (!Auth::user()->isCourseBooked($course_id))
        {
            return redirect()->route('course.details', ['id' => $course_id]);
        }

        try {
            $this->courseFeedbackRepository->updateOrCreate(Auth::user()->id, $course_id, $request->all());
        } catch (Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->route('course.feedback.index', ['id' => $course_id]);
    }
}
