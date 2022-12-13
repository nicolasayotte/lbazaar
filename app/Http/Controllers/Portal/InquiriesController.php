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

    public function store(Request $request)
    {
        $request->validate([
            'name'    => 'required|apha',
            'email'   => 'required|email',
            'subject' => 'required|alpha_num',
            'message' => 'required|alpha_num|max:200'
        ]);

    }
}
