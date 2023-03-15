<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\RegisterVoteRequest;
use App\Mail\DeniedTeacherApplication;
use App\Models\CourseApplication;
use App\Models\TeacherApplication;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\UserRepository;
use App\Repositories\VoteRepository;
use App\Services\API\EmailService;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class VoteController extends Controller
{
    private $voteRepository;

    private $userRepository;

    private $courseApplicationRepository;

    private $emailService;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->voteRepository = new VoteRepository();
        $this->courseApplicationRepository = new CourseApplicationRepository();
        $this->emailService = new EmailService();
    }

    public function register(RegisterVoteRequest $request)
    {
        $inputs = $request->all();

        // Check if vote results are not yet submitted
        if ($vote = $this->voteRepository->processVotes($inputs)) {

            if ($vote->is_approved) {

                $repositoryByClass = [
                    TeacherApplication::class => $this->userRepository,
                    CourseApplication::class => $this->courseApplicationRepository
                ];

                $repositoryByClass[$vote->voteable::class]->processApplication($vote->voteable);
            } else {

                // Check if teacher application then send rejection email
                if ($vote->voteable::class == TeacherApplication::class) {
                    $this->emailService->sendDeniedTeacherApplicationNOtification($vote->voteable);
                }

                // Check if class application then send rejection email
                if ($vote->voteable::class == CourseApplication::class) {

                    $vote->voteable->denied_at = Carbon::now();
                    $vote->voteable->approved_at = null;

                    $vote->voteable->save();

                    $this->emailService->sendEmailCourseApplicationUpdate($vote->voteable);
                }
            }

            return response()->json(['message' => 'Vote results successfully registered'], 200);
        }

        return response()->json(['message' => trans('validation.exists', ['attribute' => 'vote id'])], 422);
    }
}
