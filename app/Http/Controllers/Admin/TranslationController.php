<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TranslationRequest;
use App\Repositories\TranslationRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TranslationController extends Controller
{
    private $title = 'Translations | Admin';

    private $translationRepository;

    public function __construct()
    {
        $this->translationRepository = new TranslationRepository();
    }

    public function index()
    {
        return Inertia::render('Admin/Settings/Translations/Index', [
            'title'        => $this->title,
            'translations' => $this->translationRepository->getAll()
        ])->withViewData([
            'title' => $this->title
        ]);
    }

    public function update(TranslationRequest $request)
    {
        $this->translationRepository->massUpdate($request['translations']);

        return redirect()->back();
    }
}
