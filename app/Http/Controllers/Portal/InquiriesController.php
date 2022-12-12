<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InquiriesController extends Controller
{
    public function index()
    {
        return Inertia::render('portal/Inquiries', [])->withViewData([
            'title' => 'Inquiries'
        ]);
    }
}
