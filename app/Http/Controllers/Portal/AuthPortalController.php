<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthPortalRequest;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class AuthPortalController extends Controller
{
    public function login()
    {
        if (auth()->check() && auth()->user()->hasRole(Role::STUDENT)) {
            return redirect()->back();
        }

        return Inertia::render('Portal/Login', [])->withViewData([
            'title' => 'Portal Login'
        ]);
    }

    public function authenticate(AuthPortalRequest $request)
    {
        if (Auth::attempt([
            'email'      => $request['email'],
            'password'   => $request['password'],
            'is_enabled' => 1,
            fn ($query) => $query->whereRoleIs(Role::STUDENT)->where('email_verified_at', '!=', NULL)
        ])) {
            return redirect()->intended('/inquiries');
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
