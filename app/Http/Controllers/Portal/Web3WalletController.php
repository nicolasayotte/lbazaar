<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\Web3WalletRequest;
use App\Models\UserWallet;
use App\Models\User;
use App\Models\Role;
use Exception;
use App\Services\API\EmailService;
use App\Services\API\WalletService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class Web3WalletController extends Controller
{


    //protected $emailService;

    //protected $walletService;

    //public function __construct(EmailService $emailService, WalletService $walletService)
    //{
    //    $this->emailService = $emailService;
    //    $this->walletService = $walletService;
    //}

    /**
     * Apply middleware to all of these routes
     */
    public function __construct () {
        $this->middleware('auth');
    }

    /**
     * web3 wallet info
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function info(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
            //$user = User::where('email', $inputs['email'])->first();
            //$userWallet = $user->userWallet()->first();
            //$walletTransactionHistory = $this->walletService->feed($userWallet, $inputs['points']);
            //$this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);
            //return response()->json([
            //    'message' => getTranslation('success.wallet.feed'),
            //], 200);
            $changeAddr = $request->input('changeAddr'); 
            $cmd = '(cd ../web3/;node ./run/wallet-info.mjs '.escapeshellarg($changeAddr).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                // Only update user_wallets table with stake key only
                // it has been successfully verified
                $userId = Auth::user()->id;
                $user_wallets = UserWallet::where('user_id', $userId)
                ->update(['stake_key_hash' => $responseJSON->stakeKeyHash,
                            'updated_at' => $responseJSON->date]);
            }
                
            return [
                $response
            ];

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }

    }
}
