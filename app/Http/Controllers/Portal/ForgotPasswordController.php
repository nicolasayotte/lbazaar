<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    public function index()
    {
        return Inertia::render('portal/ForgotPassword')->withViewData([
                'title'       => 'Forgot Password',
                'description' => 'forgot password'
            ]);
    }

    public function validateEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
 
        $status = Password::sendResetLink(
            $request->only('email')
        );
    
        return $status === Password::RESET_LINK_SENT
                    ? back()->with(['status' => __($status)])
                    : back()->withErrors(['email' => __($status)]);
    }

    public function passwordReset($token) {
        return Inertia::render('portal/ResetPassword', ['token' => $token])->withViewData([
            'title'       => 'Reset Password',
            'description' => 'resetting the password'
        ]);
    }
}
