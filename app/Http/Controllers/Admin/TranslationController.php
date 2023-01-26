<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TranslationController extends Controller
{
    private $title = 'Translations | Admin';

    public function index()
    {
        return Inertia::render('Admin/Settings/Translations/Index', [
            'title' => $this->title
        ])->withViewData([
            'title' => $this->title
        ]);
    }
}
