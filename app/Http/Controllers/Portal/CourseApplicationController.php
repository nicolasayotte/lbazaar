<?php

namespace App\Http\Controllers\Portal;

use App\Data\CourseApplicationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\CourseApplicationRequest;
use App\Mail\CourseApplicationUpdate;
use App\Models\CourseApplication;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseTypeRepository;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class CourseApplicationController extends Controller
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
        return Inertia::render('Portal/MyPage/ClassApplications/Index', [
            'courseApplications' => $this->courseApplicationRepository->getMyCourseApplications($request->all()),
            'categoryOptions'    => $this->courseCategoryRepository->getDropdownData(),
            'typeOptions'        => $this->courseTypeRepository->getDropdownData(),
            'keyword'            => @$request['keyword'] ?? '',
            'course_type'        => @$request['course_type'] ?? '',
            'category'           => @$request['category'] ?? '',
            'status'             => @$request['status'] ?? '',
            'sort'               => @$request['sort'] ?? 'created_at:desc',
            'page'               => @$request['page'] ?? 1,
            'title'              => 'My Page | Class Application'
        ])->withViewData([
            'title'              => 'My Page | Class Application'
        ]);
    }

    public function create()
    {
        return Inertia::render('Portal/MyPage/ClassApplications/Form', [
            'categoryOptions'    => $this->courseCategoryRepository->getDropdownData(),
            'typeOptions'        => $this->courseTypeRepository->getDropdownData(),
            'title'              => 'My Page | Class Application',
            'command'            => Session::get('command')
        ])->withViewData([
            'title'              => Session::has('command') ? Session::get("command") : ''
        ]);
    }

    public function generate(CourseApplicationRequest $request)
    {
        session()->flash('command', 'commandsamplehere');
        return redirect()->back();
    }

    public function view($id)
    {
        return Inertia::render('Portal/MyPage/ClassApplications/View',[
            'courseApplication'     => CourseApplicationData::fromModel($this->courseApplicationRepository->with(['professor.classification'])->findOrFail($id)),
            'title'                 => 'My Page | Class Application'
        ])->withViewData([
            'title'                 => 'My Page | Class Application'
        ]);
    }

}
