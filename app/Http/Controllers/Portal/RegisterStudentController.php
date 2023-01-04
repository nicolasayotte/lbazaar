<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterStudentRequest;
use App\Mail\EmailNotification;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\Country;
use App\Models\User;
use App\Models\Role;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Exception;

class RegisterStudentController extends Controller
{
    public function index()
    {
        $countries = Country::all();

        return Inertia::render('Portal/RegisterStudent', [
            'countries' => $countries
        ])->withViewData([
            'title' => 'Sign Up'
        ]);
    }

    public function verifyEmail()
    {
        return Inertia::render('Portal/Registration/VerifyEmail', [
        ])->withViewData([
            'title' => 'Email Verification'
        ]);
    }

    public function resendEmailVerification()
    {
        event(new Registered(auth()->user()));
        return redirect()->back()->with('message', 'Verification link sent!');
    }

    public function verificationHanlder(EmailVerificationRequest $request)
    {
        $request->fulfill();
        return redirect('/');
    }

    public function store(RegisterStudentRequest $request)
    {
        $notHashPassword = $request['password'];
        $request['password'] = Hash::make($request['password']);

        $user = User::create($request->all());
        $user->attachRole(Role::STUDENT);

        event(new Registered($user));

        if (Auth::attempt([
            'email'     => $request['email'],
            'password'  => $notHashPassword,
            fn ($query) => $query->whereRoleIs(Role::STUDENT)
        ])) {
            return redirect()->route('verify.email');
        }

        return redirect()->route('register.index');
    }

    public function logout(Request $request)
    {
        auth()->logout();

        $request->session()->invalidate();

        return redirect()->route('top');
    }
}
