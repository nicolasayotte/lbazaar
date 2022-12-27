<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Country;
use App\Models\User;
use App\Models\Role;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

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

        $validatedData['password'] = Hash::make($validatedData['password']);

        $user = User::create($validatedData);
        $user->attachRole(Role::STUDENT);

        return redirect()->route('register.index');
    }
}
