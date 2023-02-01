<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TranslationRequest;
use App\Repositories\TranslationRepository;
use Inertia\Inertia;

class TranslationController extends Controller
{
    private $translationRepository;

    public function __construct()
    {
        $this->translationRepository = new TranslationRepository();
    }

    public function index()
    {
        $title = TranslationRepository::getTranslation('title.translations');

        return Inertia::render('Admin/Settings/Translations/Index', [
            'title'        => $title,
            'translations' => $this->translationRepository->getAll()
        ])->withViewData([
            'title' => $title
        ]);
    }

    public function update(TranslationRequest $request)
    {
        $this->translationRepository->massUpdate($request['translations']);

        return redirect()->back();
    }
}
