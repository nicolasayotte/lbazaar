<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryFormRequest;
use App\Models\CourseCategory;
use App\Repositories\CourseCategoryRepository;
use App\Repositories\TranslationRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseCategoryController extends Controller
{
    private $courseCategoryRepository;

    public function __construct()
    {
        $this->courseCategoryRepository = new CourseCategoryRepository();
    }

    public function index(Request $request)
    {
        $title = TranslationRepository::getTranslation('title.categories');

        return Inertia::render('Admin/Settings/CourseCategories/Index', [
            'categories' => $this->courseCategoryRepository->get($request->all()),
            'keyword'    => @$request['keyword'] ?? '',
            'sort'       => @$request['sort'] ?? 'created_at:desc',
            'page'       => @$request['page'] ?? 1,
            'title'      => $title
        ])->withViewData([
            'title' => $title,
        ]);
    }

    public function store(CategoryFormRequest $request)
    {
        $this->courseCategoryRepository->create($request->all());

        return redirect()->back();
    }

    public function update(CategoryFormRequest $request, $id)
    {
        $input = $request->all();

        $courseCategory = $this->courseCategoryRepository->findOrFail($id);

        $courseCategory->update(['name' => @$input['name']]);

        return redirect()->back();
    }

    public function delete($id)
    {
        $this->courseCategoryRepository->destroy($id);

        return redirect()->back();
    }
}
