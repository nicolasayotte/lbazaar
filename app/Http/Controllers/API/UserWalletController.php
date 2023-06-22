<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\UserWallet;
use App\Http\Requests\API\UserWalletRequest;
use App\Models\WalletTransactionHistory;
use App\Models\User;
use App\Models\Role;
use Exception;
use App\Services\API\EmailService;
use App\Services\API\WalletService;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class UserWalletController extends Controller
{

    protected $emailService;
    protected $walletService;

    public function __construct(EmailService $emailService, WalletService $walletService)
    {
        $this->emailService = $emailService;
        $this->walletService = $walletService;
    }

    /**
     * feed user wallet
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    //public function feed(UserWalletRequest $request)
    public function feed(Request $request)
    {
        Log::debug('UserWalletRequest: ' . $request);
        try {
            $headers = $request->header();
            
            // Get blockfrost api signature
            $apiSignature = $headers['blockfrost-signature'][0];
            //$bodyJSON = json_encode($request);
            $body = $request->all();
            $cmd = '(cd ../web3/;node ./run/blockfrost-verify.mjs '
            .escapeshellarg(json_encode($apiSignature)).' '
            .escapeshellarg(json_encode($body)).') 2>> ../storage/logs/web3.log'; 

            $response = exec($cmd);
            $responseJSON = json_decode($response, false);

            if ($responseJSON->status == 200)
            {
                $txId = $body['payload'][0]['tx']['hash'];
                Log::debug('$txId: ' . $txId);
                $userWalletTrans = WalletTransactionHistory::where('tx_id', $txId)->first();
                if (!$userWalletTrans->user_wallet_id) {
                    throw new \Exception("Wallet ID not found");
                }
                $points = $userWalletTrans->points_after - $userWalletTrans->points_before;
                if ($points < 1) {
                    throw new \Exception("Negative point balance not allowed");
                }
                $userId = $userWalletTrans->user_wallet_id;
                $user = User::where('id', $userId)->first();
                $userWallet = UserWallet::where('user_id', $userId)->first();
                $walletTransactionHistory = $this->walletService->feed($userWallet, $points, $txId, 'confirmed');
                $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);
                return response()->json([
                    'message' => getTranslation('success.wallet.feed'),
                ], 200);

                return [
                    $response
                ];
            } else {
                return [
                    '{"status": "502", "msg": "Wallet feed failed"}'
                ];
            }

            /*
            //if ($apiKey != env('CALLBACK_API_KEY')) {
            //    throw new \Exception("Api-Key is not valid");
            //}
            $inputs = $request->all();
            $txId = $inputs['tx_id'];
            $userWalletTrans = WalletTransactionHistory::where('tx_id', $txId)->first();
            if (!$userWalletTrans->user_wallet_id) {
                throw new \Exception("Wallet ID not found");
            }
            $points = $userWalletTrans->points_after - $userWalletTrans->points_before;
            if ($points < 1) {
                throw new \Exception("Negative point balance not allowed");
            }
            $userId = $userWalletTrans->user_wallet_id;
            $userWallet = UserWallet::where('user_id', $userId)->first();
            $walletTransactionHistory = $this->walletService->feed($userWallet, $points, $txId, 'confirmed');
            $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);
            return response()->json([
                'message' => getTranslation('success.wallet.feed'),
            ], 200);
            */

            /*
            $user = User::where('email', $inputs['email'])->first();
            $userWallet = $user->userWallet()->first();
            $walletTransactionHistory = $this->walletService->feed($userWallet, $inputs['points']);
            $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);
            return response()->json([
                'message' => getTranslation('success.wallet.feed'),
            ], 200);
            */

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }

    }

    /**
     * exchange user points to nft
     * @param UserWalletRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function exchange(UserWalletRequest $request)
    {
        try {
            $inputs = $request->all();
            $user = User::where('email', $inputs['email'])->first();
            $userWallet = $user->userWallet()->first();

            if ($userWallet->points > $inputs['points']) {
                $walletTransactionHistory = $this->walletService->exchange($userWallet, $inputs['points']);
                $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);

                return response()->json([
                    'message' => getTranslation('success.wallet.exchange'),
                ], 200);
            } else {
                return response()->json([
                    'message' => getTranslation('error'),
                ], 422);
            }

        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
