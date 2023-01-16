<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseCategoryController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings/CourseCategory')->withViewData([
            'title' => 'Categories | Admin'
        ]);
    }
}
