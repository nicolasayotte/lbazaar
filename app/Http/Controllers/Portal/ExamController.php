<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateExamRequest;
use App\Models\Exam;
use App\Models\UserExam;
use App\Repositories\ExamRepository;
use App\Repositories\TranslationRepository;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExamController extends Controller
{
    private $examRepository;

    public function __construct()
    {
        $this->examRepository = new ExamRepository();
    }

    public function index($id, Request $request)
    {
        return Inertia::render('Portal/MyPage/ManageClass/Exams', [
            'title'    => 'Manage Class - Exams',
            'exams'    => $this->examRepository->searchCourseExams($id, $request->all()),
            'tabValue' => 'exams',
            'courseId' => $id,
            'keyword'  => @$request['keyword'] ?? '',
            'status'   => @$request['status'] ?? '',
            'sort'     => @$request['sort'] ?? 'created_at:desc',
            'page'     => @$request['page'] ?? 1
        ])->withViewData([
            'title' => 'Manage Class - Exams'
        ]);
    }

    public function create($id)
    {
        return Inertia::render('Portal/Exams/Create', [
            'title'    => TranslationRepository::getTranslation('texts.create_exam'),
            'courseId' => $id
        ])->withViewData([
            'title' => TranslationRepository::getTranslation('texts.create_exam')
        ]);
    }

    public function edit($id)
    {
        $exam = $this->examRepository->with(['items', 'items.choices'])->findOrFail($id);

        return Inertia::render('Portal/Exams/Create', [
            'title'    => TranslationRepository::getTranslation('texts.edit_exam'),
            'exam'     => $exam,
            'courseId' => $exam->course_id
        ])->withViewData([
            'title' => TranslationRepository::getTranslation('texts.edit_exam'),
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

    public function view($id)
    {
        if (!@$this->examRepository->canUserTakeExam(auth()->user()->id, $id)) {
            return abort(401);
        }

        $exam = $this->examRepository->with(['items', 'items.choices'])->findOrFail($id);

        return Inertia::render('Portal/Exams/View', [
            'title' => $exam->name,
            'exam'  => $exam
        ])->withViewData([
            'title' => $exam->name
        ]);
    }

    public function submit($id, Request $request)
    {
        $exam = $this->examRepository->findOrFail($id);

        $examResult = $this->examRepository->submitAnswers($exam, $request['answers']);

        session()->flash('success', TranslationRepository::getTranslation('success.exams.submit'));

        return to_route('exams.result', ['id' => $examResult->id]);
    }

    public function result($id)
    {
        $result = UserExam::with('exam')->findOrFail($id);

        return Inertia::render('Portal/Exams/Result', [
            'title'  => $result->exam->name,
            'result' => $result
        ])->withViewData([
            'title'  => $result->exam->name
        ]);
    }
}
