<?php

namespace App\Http\Controllers\Portal;

use App\Data\CourseApplicationData;
use App\Http\Controllers\Controller;
use App\Http\Requests\CourseApplicationRequest;
use App\Models\Course;
use App\Repositories\CourseApplicationRepository;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\VoteRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseApplicationController extends Controller
{
    private $courseApplicationRepository;

    private $courseCategoryRepository;

    private $courseTypeRepository;

    private $voteRepository;

    public function __construct()
    {
        $this->courseApplicationRepository = new CourseApplicationRepository();
        $this->courseCategoryRepository    = new CourseCategoryRepository();
        $this->courseTypeRepository        = new CourseTypeRepository();
        $this->voteRepository              = new VoteRepository();
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
            'title'              => getTranslation('texts.mypage').' | '.getTranslation('title.class.applications.index')
        ])->withViewData([
            'title'              => getTranslation('texts.mypage').' | '.getTranslation('title.class.applications.index')
        ]);
    }

    public function create()
    {
        return Inertia::render('Portal/MyPage/ClassApplications/Create', [
            'categoryOptions'    => $this->courseCategoryRepository->getDropdownData(),
            'typeOptions'        => $this->courseTypeRepository->getDropdownData(),
            'title'              => getTranslation('texts.mypage').' | '.getTranslation('title.class.applications.create')
        ])->withViewData([
            'title'              => getTranslation('texts.mypage').' | '.getTranslation('title.class.applications.create')
        ]);
    }

    public function store(CourseApplicationRequest $request)
    {
        $inputs = $request->all();

        $inputs['is_live'] = $inputs['format'] == Course::LIVE ? true : false;
        $inputs['max_participant'] = $inputs['seats'];
        $inputs['data'] = json_encode($request->all());

        $inputs['professor_id'] = auth()->user()->id;
        $inputs['course_type_id'] = $this->courseTypeRepository->findByName($inputs['type'])->id;
        $inputs['course_category_id'] = $this->courseCategoryRepository->firstOrCreate($inputs['category'])->id;

        $courseApplication = $this->courseApplicationRepository->create($inputs);

        $vote = $this->voteRepository->generateNewId($courseApplication);

        return to_route('mypage.course.applications.index')->with('success', getTranslation('success.class.applications.create'));
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
            'title'                 => getTranslation('texts.mypage').' | '.getTranslation('title.class.applications.view')
        ])->withViewData([
            'title'                 => getTranslation('texts.mypage').' | '.getTranslation('title.class.applications.view')
        ]);
    }

}
