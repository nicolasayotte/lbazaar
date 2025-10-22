<?php

namespace App\Http\Controllers\Portal;

use App\Facades\Discord;
use App\Http\Controllers\Controller;
use App\Http\Requests\TeacherRegistrationRequest;
use App\Repositories\TeacherApplicationRepository;
use App\Repositories\VoteRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegisterTeacherController extends Controller
{
    private $teacherApplicationRepository;

    private $voteRepository;

    public function __construct()
    {
        $this->voteRepository = new VoteRepository();
        $this->teacherApplicationRepository = new TeacherApplicationRepository();
    }

    public function index()
    {
        if (auth()->check()) {
            return redirect()->back();
        }

        return Inertia::render('Portal/Registration/Teacher', [
            'title' => getTranslation('texts.sign_up')
        ])->withViewData([
            'title' => getTranslation('texts.sign_up')
        ]);
    }

    public function store(TeacherRegistrationRequest $request)
    {
        $inputs = $request->all();

        $data = json_encode($request->all());

        $inputs['data'] = $data;

        $teacherApplication = $this->teacherApplicationRepository->create($inputs);

        $vote = $this->voteRepository->generateNewId($teacherApplication);

        return to_route('register.teacher.success')->with('success', getTranslation('success.teacher_applications.submitted'));
    }

    public function success()
    {
        return Inertia::render('Portal/Registration/Success', [
            'title' => getTranslation('texts.sign_up')
        ])->withViewData([
            'title' => getTranslation('texts.sign_up')
        ]);
    }
}
