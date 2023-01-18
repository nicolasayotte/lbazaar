<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseTypeController extends Controller
{
    private $title = 'Class Types';

    public function index()
    {
        return Inertia::render('Admin/Settings/CourseTypes/Index', [
            'title' => $this->title
        ])->withViewData([
            'title' => $this->title
        ]);
    }
}
