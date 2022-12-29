<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Models\Country;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class ProfileController extends Controller
{
    private $userRepository;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
    }

    public function index()
    {
        $countries = Country::all();

        return Inertia::render('Admin/Profile/Index', [
            'countries' => $countries
        ])->withViewData([
            'title' => 'Profile | Admin'
        ]);
    }

    public function update(ProfileRequest $request)
    {
        $user = $this->userRepository->findOne(auth()->user()->id);

        $user->update($request->all());

        return redirect()->route('admin.profile.index');
    }

    public function update_password(UpdatePasswordRequest $request)
    {
        $user = $this->userRepository->findOne(auth()->user()->id);

        $user->update(['password' => bcrypt($request['new_password'])]);

        return redirect()->route('admin.profile.index');
    }
}
