<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class AuthPortalController extends Controller
{
    public function login(Request $request)
    {
        if (auth()->check() && auth()->user()->hasRole(Role::STUDENT)) {
            return redirect()->back();
        }

        return Inertia::render('Portal/Login', [])->withViewData([
            'title' => 'Portal Login'
        ]);
    }

    public function authenticate(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required',
            'password' => 'required'
        ]);

        if (Auth::attempt([
            'email'     => $credentials['email'],
            'password'  => $credentials['password'],
            fn ($query) => $query->whereRoleIs(Role::STUDENT)
        ])) {
            return redirect()->intended('/');
        }
        return redirect()->back()->withErrors(['email' => 'Invalid credentials']);
    }

    public function verifyEmail()
    {
        return Inertia::render('Portal/Registration/VerifyEmail', [
        ])->withViewData([
            'title' => 'Email Verification'
        ]);
    }
    public function logout(Request $request)
    {
        auth()->logout();

        $request->session()->invalidate();

        return redirect()->route('top');
    }
}
