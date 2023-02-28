<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\CourseApplicationRequest;
use App\Models\CourseApplication;
use App\Models\CourseCategory;
use App\Models\CourseType;
use App\Models\User;
use App\Services\API\EmailService;
use Exception;
use DB;
use Illuminate\Support\Carbon;
class CourseApplicationController extends Controller
{

    protected $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Login The User
     * @param CourseApplicationRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function create(CourseApplicationRequest $request)
    {
        DB::beginTransaction();
        try {
            $inputs = $request->all();
            $inputs['max_participant'] = $inputs['max_participants'];
            $inputs['is_live'] = 0;
            $courseType = CourseType::whereRaw("UPPER(name) LIKE '%". strtoupper($inputs['type'])."%'")->first();
            if(is_int($inputs['category'])) {
                $courseCategory = CourseCategory::find($inputs['category']);
                if ($courseCategory === null) {
                    $courseCategory = CourseCategory::create(['name' => $inputs['category']]);
                }
            } else {
                $courseCategory = CourseCategory::where(['name' => $inputs['category']])->first();
                if ($courseCategory === null) {
                    $courseCategory = CourseCategory::create(['name' => $inputs['category']]);
                }
            }

            $inputs['course_category_id'] = $courseCategory->id;
            $inputs['course_type_id'] = $courseType->id;
            $user = User::where('email', $inputs['email'])->first();
            $inputs['professor_id'] = $user->id;
            if ($inputs['status'] == CourseApplication::APPROVED) {
                $inputs['approved_at'] = Carbon::now();
            }

            unset($inputs['type']);
            unset($inputs['category']);
            unset($inputs['email']);
            unset($inputs['max_participants']);

            $courseApplication = CourseApplication::create($inputs);
            $this->emailService->sendEmailCourseApplicationUpdate($courseApplication);
            DB::commit();
            return response()->json([
                'message' => getTranslation('success.class.applications.create'),
            ], 200);
        } catch (Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }

    }
}
