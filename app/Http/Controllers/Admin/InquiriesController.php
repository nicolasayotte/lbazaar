<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Repositories\InquiryRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InquiriesController extends Controller
{
    private $inquiryRepository;

    public function __construct()
    {
        $this->inquiryRepository = new InquiryRepository();
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/Inquiries/Index', [
            'inquiries' => $this->inquiryRepository->get($request->all()),
            'page'      => @$request['page'] ?? 1,
            'keyword'   => @$request['keyword'] ?? '',
            'sort'      => @$request['sort'] ?? 'created_at:desc'
        ])->withViewData([
            'title' => 'Admin - Inquiries'
        ]);
    }
}
