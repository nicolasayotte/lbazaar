<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\Country;
use App\Models\User;
use App\Models\Role;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Auth\Events\Registered;

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

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name'            => 'required|alpha_spaces',
            'last_name'             => 'required|alpha_spaces',
            'email'                 => 'required|email|unique:users',
            'country_id'            => 'required',
            'password'              => 'required|confirmed|min:8',
            'password_confirmation' => 'required'
        ]);

        $notHashPassword = $validatedData['password'];
        $validatedData['password'] = Hash::make($validatedData['password']);

        $user = User::create($validatedData);
        $user->attachRole(Role::STUDENT);

        event(new Registered($user));

        if (Auth::attempt([
            'email'     => $validatedData['email'],
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
