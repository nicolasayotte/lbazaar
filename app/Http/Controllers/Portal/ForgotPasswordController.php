<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;

class ForgotPasswordController extends Controller
{
    private $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }
    
    public function index()
    {
        return Inertia::render('Portal/ForgotPassword')->withViewData([
                'title'       => 'Forgot Password',
                'description' => 'forgot password'
            ]);
    }

    public function validateEmail(ForgotPasswordRequest $request)
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );
    
        return $status === Password::RESET_LINK_SENT
                    ? back()->with(['status' => __($status)])
                    : back()->withErrors(['email' => __($status)]);
    }

    public function passwordReset($token) {
        return Inertia::render('Portal/ResetPassword', ['token' => $token])->withViewData([
            'title'       => 'Reset Password',
            'description' => 'resetting the password',
        ]);
    }

    public function updatePassword(ResetPasswordRequest $request)
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ]);
                $user->save();
            }
        );
     
        return $status === Password::PASSWORD_RESET
                    ? redirect()->route('portal.login')->with('status', __($status))
                    : back()->withErrors(['email' => [__($status)]]);
    }

}