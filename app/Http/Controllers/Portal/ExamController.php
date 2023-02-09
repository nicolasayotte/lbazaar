<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateExamRequest;
use App\Repositories\ExamRepository;
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
            'tabValue' => 'exams',
            'courseId' => $id
        ])->withViewData([
            'title' => 'Manage Class - Exams'
        ]);
    }

    public function create($id)
    {
        return Inertia::render('Portal/Exams/Create', [
            'title' => 'Manage Class - Create Exam',
            'courseId' => $id
        ])->withViewData([
            'title' => 'Manage Class - Create Exam'
        ]);
    }

    public function store($id, CreateExamRequest $request)
    {
        $inputs = $request->all();

        $inputs['course_id'] = $id;

        $this->examRepository->create($inputs);

        return to_route('mypage.course.manage_class.exams');
    }
}
