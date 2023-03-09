<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegisterTeacherController extends Controller
{
    public function index()
    {
        return Inertia::render('Portal/Registration/Teacher', [])->withViewData([
            'title' => 'Sign Up'
        ]);
    }
}
