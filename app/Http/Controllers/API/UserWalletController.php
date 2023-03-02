<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\UserWalletRequest;
use App\Models\User;
use App\Models\Role;
use Exception;
use App\Services\API\EmailService;
use App\Services\API\WalletService;

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
    public function feed(UserWalletRequest $request)
    {
        try {
            $inputs = $request->all();
            $user = User::where('email', $inputs['email'])->first();
            $userWallet = $user->userWallet()->first();
            $walletTransactionHistory = $this->walletService->feed($userWallet, $inputs['points']);
            $this->emailService->sendEmailNotificationWalletUpdate($user, $walletTransactionHistory);
            return response()->json([
                'message' => getTranslation('success.wallet.feed'),
            ], 200);
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
