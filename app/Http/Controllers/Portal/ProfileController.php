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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Facades\Asset;
use App\Facades\Discord;
use App\Services\API\EmailService;
use App\Services\API\WalletService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    private $userRepository;

    private $walletService;

    private $emailService;

    public function __construct()
    {
        $this->userRepository = new UserRepository();
        $this->walletService = new WalletService();
        $this->emailService = new EmailService();
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

    public function feedPointsToWallet(Request $request)
    {
        $inputs = $request->all();

        $userWallet = auth()->user()->userWallet()->first();

        $walletTransactionHistory = $this->walletService->feed($userWallet, $inputs['points']);

        $this->emailService->sendEmailNotificationWalletUpdate(auth()->user(), $walletTransactionHistory);

        return redirect()->back()->with('success', getTranslation('success.wallet.feed'));
    }

    public function exchangeToNFTRequest(Request $request)
    {
        $userWallet = auth()->user()->userWallet()->first();

        $validation = Validator::make($request->all(), [
            'points' => 'integer|max:' . $userWallet->points
        ]);

        if ($validation->fails()) {
            return redirect()->back()->with('error', getTranslation('error'));
        }

        $data = [
            'user'   => auth()->user(),
            'points' => $request['points'],
            'wallet_id' => $request['wallet_id']
        ];

        if (!Discord::sendMessage($data, 'exchange')) {
            return redirect()->back()->withErrors('error', getTranslation('error'));
        }

        return redirect()->back()->with('success', getTranslation('success.wallet.exchange'));
    }

}
