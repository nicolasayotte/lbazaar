<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function view()
    {
        return Inertia::render('admin/Profile', [])->withViewData([
            'title' => 'Profile'
        ]);
    }
}
