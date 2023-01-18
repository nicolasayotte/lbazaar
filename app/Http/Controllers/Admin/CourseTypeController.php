<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Settings/CourseTypes/Index')->withViewData([
            'title' => 'Class Types | Admin'
        ]);
    }
}
