<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\SearchClassRequest;
use App\Models\Country;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\CourseHistoryRepository;
use App\Repositories\CourseRepository;
use App\Repositories\CourseTypeRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseHistoryController extends Controller
{
    public $courseTypeRepository;

    public $courseCategoryRepository;

    public $courseHistoryRepository;

    public $userRepository;

    public $courseRepository;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
        $this->courseCategoryRepository = new CourseCategoryRepository();
        $this->courseHistoryRepository = new CourseHistoryRepository();
        $this->userRepository = new UserRepository();
        $this->courseRepository = new CourseRepository();
    }

    public function index(SearchClassRequest $request)
    {
        $countries = Country::all();
        $types = $this->courseTypeRepository->getAll();
        $categories = $this->courseCategoryRepository->getAll();

        $courseHistories = $this->courseHistoryRepository->search($request, Auth::user()->id);

        return Inertia::render('Portal/MyPage/CourseHistory/Index', [
            'course_types'          => $types,
            'course_categories'     => $categories,
            'course_histories'      => $courseHistories,
            'countries'             => $countries,
            'page'                  => @$request['page'] ?? 1,
            'month'                 => @$request['month'] ?? date('Y-m'),
            'keyword'               => @$request['keyword'] ?? '',
            'category_id'           => @$request['category_id'] ?? '',
            'type_id'               => @$request['type_id'] ?? '',
            'status'                => @$request['status'] ?? '',
            'language'              => @$request['language'] ?? '',
            'sort'                  => @$request['sort'] ?? 'course_histories.created_at:desc',
            'title'                 => getTranslation('texts.mypage').' | '.getTranslation('texts.class_history')
        ])->withViewData([
            'title'                 => getTranslation('texts.mypage').' | '.getTranslation('texts.class_history')
        ]);
    }
}
