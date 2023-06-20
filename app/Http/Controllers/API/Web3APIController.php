<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\Web3WalletRequest;
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
     * @param Web3WalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function info(Web3WalletRequest $request)
    {
        try {
            $inputs = $request->all();
            Log::debug($inputs);
            $changeAddr = $request->input('changeAddr'); 
            $cmd = '(cd ../web3/;node ./run/wallet-info.mjs '.escapeshellarg($changeAddr).') 2>> ../storage/logs/web3.log'; 
            
            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                // Only update user_wallets table with stake key only
                // it has been successfully verified
                $userId = Auth::user()->id;
                $user_wallets = UserWallets::where('user_id', $userId)
                ->update(['stake_key_hash' => $responseJSON->stakeKeyHash,
                            'timestamp' => $responseJSON->date]);
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
