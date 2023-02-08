<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\InquiryRepository;
use App\Repositories\TranslationRepository;
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
        $title = TranslationRepository::getTranslation('title.inquiries.index');

        return Inertia::render('Admin/Inquiries/Index', [
            'inquiries' => $this->inquiryRepository->get($request->all()),
            'page'      => @$request['page'] ?? 1,
            'keyword'   => @$request['keyword'] ?? '',
            'sort'      => @$request['sort'] ?? 'created_at:desc',
            'title'     => $title
        ])->withViewData([
            'title' => $title
        ]);
    }

    public function view($id)
    {
        $title = TranslationRepository::getTranslation('title.inquiries.view');

        return Inertia::render('Admin/Inquiries/View', [
            'inquiry' => $this->inquiryRepository->findOne($id),
            'title' => $title
        ])->withViewData([
            'title' => $title
        ]);
    }
}
