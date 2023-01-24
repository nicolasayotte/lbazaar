<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\InquiryRequest;
use App\Mail\Inquiry as MailInquiry;
use App\Models\Inquiry;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class InquiriesController extends Controller
{
    public function index()
    {
        return Inertia::render('Portal/Inquiries', [
            'title' => 'Inquiries'
        ])->withViewData([
            'title' => 'Inquiries'
        ]);
    }

    public function store(InquiryRequest $request)
    {
        $inquiry = Inquiry::create($request->all());

        try {
            Mail::send(new MailInquiry($inquiry));
        } catch (Exception $e) {
            return redirect()->back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->route('inquiries.index');
    }
}
