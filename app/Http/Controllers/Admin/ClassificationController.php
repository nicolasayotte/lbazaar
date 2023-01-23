<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\ClassificationRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassificationController extends Controller
{
    private $title = 'Classifications | Admin';

    private $classificationRepository;

    public function __construct()
    {
        $this->classificationRepository = new ClassificationRepository();
    }

    public function index()
    {
        return Inertia::render('Admin/Settings/Classifications/Index', [
            'title'           => $this->title,
            'classifications' => $this->classificationRepository->getAllByColumns()
        ])->withViewData([
            'title' => $this->title
        ]);
    }

    public function delete($id)
    {
        $this->classificationRepository->destroy(@$id);

        return redirect()->back();
    }
}
