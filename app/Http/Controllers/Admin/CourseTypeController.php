<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CourseTypeRequest;
use App\Repositories\CourseTypeRepository;
use App\Repositories\TranslationRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseTypeController extends Controller
{
    private $courseTypeRepository;

    public function __construct()
    {
        $this->courseTypeRepository = new CourseTypeRepository();
    }

    public function index()
    {
        $title = TranslationRepository::getTranslation('title.class.types');

        return Inertia::render('Admin/Settings/CourseTypes/Index', [
            'title' => $title,
            'types' => $this->courseTypeRepository->pluckById()
        ])->withViewData([
            'title' => $title
        ]);
    }

    public function update(CourseTypeRequest $request)
    {
        $this->courseTypeRepository->batchUpdate($request['types']);

        return redirect()->back();
    }
}
