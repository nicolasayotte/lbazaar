<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Models\Country;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        
        return Inertia::render('Portal/Profile/Index', [
            'countries' => $countries
        ])->withViewData([
            'title' => 'Profile | My page'
        ]);
    }

    public function update(ProfileRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);

        $user->update($request->all());

        return redirect()->route('profile.index');
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);

        $user->update(['password' => bcrypt($request['new_password'])]);

        return redirect()->back();
    }
}
