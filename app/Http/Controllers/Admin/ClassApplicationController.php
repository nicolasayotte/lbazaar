<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\CourseApplicationUpdate;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseTypeRepository;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ClassApplicationController extends Controller
{
    private $courseApplicationRepository;

    private $courseCategoryRepository;

    private $courseTypeRepository;

    public function __construct()
    {
        $this->courseApplicationRepository = new CourseApplicationRepository();
        $this->courseCategoryRepository    = new CourseCategoryRepository();
        $this->courseTypeRepository        = new CourseTypeRepository();
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/ClassApplications/Index', [
            'courseApplications' => $this->courseApplicationRepository->get($request->all()),
            'categoryOptions'    => $this->courseCategoryRepository->getDropdownData(),
            'typeOptions'        => $this->courseTypeRepository->getDropdownData(),
            'keyword'            => @$request['keyword'] ?? '',
            'course_type'        => @$request['course_type'] ?? '',
            'category'           => @$request['category'] ?? '',
            'status'             => @$request['status'] ?? '',
            'sort'               => @$request['sort'] ?? 'created_at:desc',
            'page'               => @$request['page'] ?? 1
        ])->withViewData([
            'title' => 'Class Applications | Admin'
        ]);
    }

    public function updateStatus($id, $status)
    {
        $courseApplication = $this->courseApplicationRepository->findOrFail($id);

        if (
            !@$courseApplication // Check if not existing
            || (!is_null(@$courseApplication->approved_at ) || !is_null(@$courseApplication->denied_at)) // Check if already approved/denied
        ) {
            return redirect()->back()->withErrors([
                'error' => trans('messages.error')
            ]);
        }

        $this->courseApplicationRepository->{$status}($id);

        # Send email
        try {
            Mail::send(new CourseApplicationUpdate($this->courseApplicationRepository->findOrFail($id)));
        } catch (Exception $e) {
            Log::error($e->getMessage());
        }

        return redirect()->back();
    }
}
