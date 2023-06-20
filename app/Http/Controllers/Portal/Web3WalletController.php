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
            $changeAddr = $request->input('changeAddr'); 
            $cmd = '(cd ../web3/;node ./run/wallet-info.mjs '.escapeshellarg($changeAddr).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            /*
            if ($responseJSON->status == 200)
            {
                // Only update user_wallets table with stake key only
                // it has been successfully verified
                $userId = Auth::user()->id;
                $user_wallets = UserWallet::where('user_id', $userId)
                ->update(['stake_key_hash' => $responseJSON->stakeKeyHash,
                            'updated_at' => $responseJSON->date]);
            }
            */
                
            return [
                $response
            ];

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }

    }

    /**
     * web3 wallet verify
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $userId = Auth::user()->id;
            Log::debug($userId);
 
            $signature = $request->input('signature');
            $stake_key = $request->input('stake_key');
            $message = $request->input('message');
            $stake_addr = $request->input('stake_addr');
            $cmd = '(cd ../web3/;node ./run/wallet-verify.mjs '
                        .escapeshellarg($signature).' '
                        .escapeshellarg($stake_key).' '
                        .escapeshellarg($message).' '
                        .escapeshellarg($stake_addr).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                // Update user_wallets table with stake key only
                // if it has been successfully verified
                $userId = Auth::user()->id;
                $user_wallets = UserWallet::where('user_id', $userId)
                ->update(['stake_key_hash' => $responseJSON->stakeKeyHash,
                          'updated_at' => $responseJSON->date]);
                return [
                    $response
                ];
            } else {
                return [
                    '{"status": "501", "msg": "Wallet verify not successful"}'
                ];
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
