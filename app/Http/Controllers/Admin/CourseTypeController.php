<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseTypeRequest;
use App\Repositories\CourseTypeRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseTypeController extends Controller
{
    private $title = 'Class Types | Admin';

    private $courseTypeRepository;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
    }

    public function index()
    {
        return Inertia::render('Admin/Settings/CourseTypes/Index', [
            'title' => $this->title,
            'types' => $this->courseTypeRepository->getKeyValuePairs()
        ])->withViewData([
            'title' => $this->title
        ]);
    }

    public function update(CourseTypeRequest $request)
    {
        $this->courseTypeRepository->batchUpdate($request['types']);

        return redirect()->back();
    }
}
