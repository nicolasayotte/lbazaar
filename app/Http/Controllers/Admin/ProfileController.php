<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{

    public function index()
    {
        $countries = Country::all();

        return Inertia::render('admin/Profile', [
            'countries' => $countries
        ])->withViewData([
            'title' => 'Profile'
        ]);
    }

    public function update(Request $request)
    {
        $userRepository = new UserRepository();

        $validatedData = $request->validate([
            'first_name' => 'required|alpha',
            'last_name'  => 'required|alpha',
            'country_id' => 'required'
        ]);

        $user = $userRepository->findOne(auth()->user()->id);

        $user->update($validatedData);

        return redirect()->route('admin.profile.index');
    }
}
