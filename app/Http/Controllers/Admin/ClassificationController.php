<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassificationController extends Controller
{
    private $title = 'Classifications | Admin';

    public function index()
    {
        return Inertia::render('Admin/Settings/Classifications/Index')->withViewData([
            'title' => $this->title
        ]);
    }
}
