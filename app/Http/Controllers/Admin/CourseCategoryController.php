<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\CourseCategoryRepository;
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
        return Inertia::render('Admin/Settings/CourseCategory', [
            'categories' => $this->courseCategoryRepository->get($request->all()),
            'keyword'    => @$request['keyword'] ?? '',
            'sort'       => @$request['sort'] ?? 'created_at:desc',
            'page'       => @$request['page'] ?? 1
        ])->withViewData([
            'title' => 'Categories | Admin',
        ]);
    }
}
