<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateBasePasswordRequest;
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

        return Inertia::render('Portal/MyPage/Profile/Index', [
            'countries' => $countries,
            'title' => 'My Page | Profile'
        ])->withViewData([
            'title' => 'My Page | Profile'
        ]);
    }

    public function update(ProfileRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);

        $user->update($request->all());

        return redirect()->route('mypage.profile.index');
    }

    public function updatePassword(UpdatePasswordRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);

        $user->update([
            'password' => bcrypt($request['new_password']),
            'is_temp_password' => false,
        ]);

        return redirect()->back();
    }

    public function updateBasePassword(UpdateBasePasswordRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);

        $user->update([
            'password' => bcrypt($request['new_password']),
            'is_temp_password' => false,
        ]);

        return to_route('top');
    }
}
