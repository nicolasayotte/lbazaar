<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    private $userRepository;

    private $roleRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->roleRepository = new RoleRepository();
    }

    public function index(Request $request)
    {
        return Inertia::render('Admin/Users/Index', [
            'users'         => $this->userRepository->get($request->all()),
            'roleOptions'   => $this->roleRepository->getFilterData(),
            'statusOptions' => $this->userRepository->getStatusFilterData(),
            'keyword'       => @$request['keyword'] ?? '',
            'role'          => @$request['role'] ?? '',
            'status'        => @$request['status'] ?? '',
            'sort'          => @$request['sort'] ?? 'created_at:desc'
        ])->withViewData([
            'title' => 'Users | Admin'
        ]);
    }
}
