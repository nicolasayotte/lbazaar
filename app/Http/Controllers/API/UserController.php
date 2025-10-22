<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\TeacherRequest;
use App\Models\User;
use App\Services\API\EmailService;
use App\Services\API\UserService;
use Exception;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use DB;

class UserController extends Controller
{
    protected $emailService;
    protected $userService;

    public function __construct(EmailService $emailService, UserService $userService)
    {
        $this->emailService = $emailService;
        $this->userService = $userService;
    }

    /**
     * register teacher user
     * @param TeacherRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function create(TeacherRequest $request)
    {
        DB::beginTransaction();
        try {
            $inputs = $request->all();
            $randomPasswordString = Str::random(User::RANDOM_PASSWORD_STRING_LENGTH);
            $inputs['password'] = Hash::make($randomPasswordString);
            $teacher = $this->userService->createTeacher($inputs);
            $educations = $inputs['education'];
            $certifications = $inputs['certifications'];
            $workHistories = $inputs['work_history'];
            $teacher->userEducation()->createMany($educations);
            $teacher->userCertification()->createMany($certifications);
            $teacher->userWorkHistory()->createMany($workHistories);

            $this->emailService->sendEmailNotificationUserCreated($teacher, $randomPasswordString);
            DB::commit();
            return response()->json([
                'message' => getTranslation('success.user.create'),
            ], 200);
        } catch (Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }

    }
}
