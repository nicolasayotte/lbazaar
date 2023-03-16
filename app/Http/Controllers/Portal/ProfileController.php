<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateBasePasswordRequest;
use App\Models\Country;
use App\Repositories\UserRepository;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http;
use App\Facades\Asset;
use App\Facades\Discord;

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
            'title' => getTranslation('texts.mypage').' | '.getTranslation('texts.profile')
        ])->withViewData([
            'title' => getTranslation('texts.mypage').' | '.getTranslation('texts.profile')
        ]);
    }

    public function update(ProfileRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);
        $inputs= $request->all();

        $inputs['image'] = Asset::upload($request->files->get('image'));
        $user->update($inputs);

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

    public function exchangeToNFTRequest($exchange_amount)
    {
        $data = [
            'user'   => auth()->user(),
            'points' => $exchange_amount
        ];

        if (!Discord::sendMessage($data, 'exchange')) {
            return redirect()->back()->withErrors(['error' => getTranslation('error')]);
        }

        return redirect()->back();
    }

}
