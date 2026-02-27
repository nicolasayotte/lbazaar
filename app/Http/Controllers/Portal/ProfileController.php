<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateBasePasswordRequest;
use App\Models\Country;
use App\Models\Setting;
use App\Models\Nft;
use App\Repositories\UserRepository;
use Inertia\Inertia;
use App\Facades\Asset;

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
        $ada_to_points = Setting::where('slug', 'ada-to-points')->first();
        $nfts = Nft::withoutTrashed()->where('for_sale', 1)->get();
        $network = env('NETWORK');

        return Inertia::render('Portal/MyPage/Profile/Index', [
            'countries' => $countries,
            'ada_to_points' =>  $ada_to_points->value,
            'nfts' => $nfts,
            'network' => $network,
            'title' => getTranslation('texts.mypage').' | '.getTranslation('texts.profile')
        ])->withViewData([
            'title' => getTranslation('texts.mypage').' | '.getTranslation('texts.profile')
        ]);
    }

    public function update(ProfileRequest $request)
    {
        $user = $this->userRepository->findOrFail(auth()->user()->id);
        $inputs= $request->all();

        if($request->hasFile('image')){
            $inputs['image'] = Asset::upload($request->files->get('image'));
        } else {
            unset($inputs['image']);
        }
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

}
