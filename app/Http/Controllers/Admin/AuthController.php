<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthRequest;
use App\Models\Role;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function login()
    {
        if (auth()->check() && auth()->user()->hasRole(Role::ADMIN)) {
            return redirect()->back();
        }

        return Inertia::render('Admin/Login', [])->withViewData([
            'title' => 'Admin Login'
        ]);
    }

    public function authenticate(AuthRequest $request)
    {
        if (Auth::attempt([
            'email'     => $request['email'],
            'password'  => $request['password'],
            fn ($query) => $query->whereRoleIs(Role::ADMIN)
        ])) {
            return redirect()->intended('admin/profile');
        }

        return redirect()->back()->withErrors(['email' => 'Invalid credentials']);
    }

    public function logout(Request $request)
    {
        auth()->logout();

        $request->session()->invalidate();

        return redirect()->route('top');
    }
}
