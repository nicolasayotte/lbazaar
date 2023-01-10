<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseTypeRepository;
use Illuminate\Http\Request;
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
}
