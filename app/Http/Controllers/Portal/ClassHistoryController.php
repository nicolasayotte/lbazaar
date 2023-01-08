<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassHistoryController extends Controller
{
    private $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    public function index()
    {
        $countries = Country::all();
        
        return Inertia::render('Portal/MyPage/ClassHistory/Index', [
            'countries' => $countries
        ])->withViewData([
            'title' => 'Class Histories | My page'
        ]);
    }
}
