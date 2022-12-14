<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Mail\Inquiry as MailInquiry;
use App\Models\Inquiry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
        $validatedData = $request->validate([
            'name'    => 'required|alpha',
            'email'   => 'required|email',
            'subject' => 'required|alpha_num',
            'message' => 'required|alpha_num|max:200'
        ]);

        $inquiry = Inquiry::create($validatedData);

        Mail::send(new MailInquiry($inquiry));

        return redirect()->route('inquiries.index');
    }
}
