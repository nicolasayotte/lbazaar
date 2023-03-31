<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateExamRequest;
use App\Models\Setting;
use App\Models\UserExam;
use App\Repositories\CourseRepository;
use App\Repositories\ExamRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamController extends Controller
{
    private $examRepository;

    private $courseRepository;

    private $baseTitle;

    public function __construct()
    {
        $this->examRepository   = new ExamRepository();
        $this->courseRepository = new CourseRepository();

        $this->baseTitle = getTranslation('title.class.manage.view') . ' - ';
    }

    public function index($id, Request $request)
    {
        return Inertia::render('Portal/MyPage/ManageClass/Exams', [
            'course'   => $this->courseRepository->findByIdManageClass($id),
            'exams'    => $this->examRepository->searchCourseExams($id, $request->all()),
            'tabValue' => 'exams',
            'courseId' => $id,
            'keyword'  => @$request['keyword'] ?? '',
            'status'   => @$request['status'] ?? '',
            'sort'     => @$request['sort'] ?? 'created_at:desc',
            'page'     => @$request['page'] ?? 1,
            'title'    => $this->baseTitle . getTranslation('title.exams'),
        ])->withViewData([
            'title'    => $this->baseTitle . getTranslation('title.exams')
        ]);
    }

    public function create($id)
    {
        return Inertia::render('Portal/Exams/Create', [
            'title'    => $this->baseTitle . getTranslation('texts.create_exam'),
            'courseId' => $id
        ])->withViewData([
            'title'    => $this->baseTitle . getTranslation('texts.create_exam')
        ]);
    }

    public function edit($id)
    {
        $exam = $this->examRepository->with(['items', 'items.choices'])->findOrFail($id);

        return Inertia::render('Portal/Exams/Create', [
            'title'    => $this->baseTitle . getTranslation('texts.edit_exam'),
            'exam'     => $exam,
            'courseId' => $exam->course_id
        ])->withViewData([
            'title'    => $this->baseTitle . getTranslation('texts.edit_exam'),
        ]);
    }

    public function update($id, CreateExamRequest $request)
    {
        $exam = $this->examRepository->findOrFail($id);

        $exam->update(['name' => $request['name']]);

        $this->examRepository->update($id, $request->all());

        return to_route('mypage.course.manage_class.exams', ['id' => $exam->course_id]);
    }

    public function toggleStatus($id, $status)
    {
        $this->examRepository->toggleStatus($id, $status);

        return redirect()->back();
    }

    public function store($id, CreateExamRequest $request)
    {
        $inputs = $request->all();

        $inputs['course_id'] = $id;

        $this->examRepository->create($inputs);

        return to_route('mypage.course.manage_class.exams', ['id' => $id]);
    }

    public function delete($id)
    {
        $this->examRepository->destroy($id);

        return redirect()->back();
    }

    public function view($course_id, $schedule_id, $id)
    {
        if (!@$this->examRepository->canUserTakeExam(auth()->user()->id, $schedule_id, $id)) {
            return abort(401);
        }

        $exam = $this->examRepository->with(['items', 'items.choices'])->findOrFail($id);

        return Inertia::render('Portal/Exams/View', [
            'title'       => $exam->name,
            'exam'        => $exam,
            'course_id'   => $course_id,
            'schedule_id' => $schedule_id
        ])->withViewData([
            'title' => $exam->name
        ]);
    }

    public function submit($course_id, $schedule_id, $id, Request $request)
    {
        $exam = $this->examRepository->findOrFail($id);

        $examResult = $this->examRepository->submitAnswers($exam, $schedule_id, $request['answers']);

        session()->flash('success', getTranslation('success.exams.submit'));

        return to_route('course.attend.exams.result', [
            'course_id'   => $course_id,
            'schedule_id' => $schedule_id,
            'id'          => $examResult->id
        ]);
    }

    public function result($course_id, $schedule_id, $id)
    {
        $result = UserExam::with('exam')->findOrFail($id);
        $examPassingPercentage = Setting::where('slug', 'exam-passing-percentage')->first();

        return Inertia::render('Portal/Exams/Result', [
            'title'       => $result->exam->name,
            'result'      => $result,
            'passing_percentage' => $examPassingPercentage->value,
            'course_id'   => $course_id,
            'schedule_id' => $schedule_id
        ])->withViewData([
            'title'  => $result->exam->name
        ]);
    }
}
