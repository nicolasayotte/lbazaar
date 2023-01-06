<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
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

    public function create()
    {
        return Inertia::render('Admin/Users/Create');
    }

    public function view($id)
    {
        return Inertia::render('Admin/Users/View', [
            'user' => $this->userRepository->findOne($id)
        ])
        ->withViewData([
            'title' => 'User Details | Admin'
        ]);
    }

    public function updateStatus($id, $status)
    {
        $user = $this->userRepository->findOrFail($id);

        $user->update(['is_enabled' => $status == User::ACTIVE ? 1 : 0]);

        return redirect()->back();
    }
}
