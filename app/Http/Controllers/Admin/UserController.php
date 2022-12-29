<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    private $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/Users/Index', [
            'users' => $this->userRepository->get($request->all())
        ])->withViewData([
            'title' => 'Users | Admin'
        ]);
    }
}
