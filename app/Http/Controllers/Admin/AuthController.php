<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        return Inertia::render('admin/Login', [])->withViewData([
            'title' => 'Admin Login'
        ]);
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        if (Auth::attempt([
            'email'     => $credentials['email'],
            'password'  => $credentials['password'],
            fn ($query) => $query->whereRoleIs(Role::ADMIN)
        ])) {
            return redirect()->intended('/');
        }

        return redirect()->back()->withErrors(['email' => 'Invalid credentials']);
    }
}
