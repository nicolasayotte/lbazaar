<?php

namespace App\Services\API;
use App\Models\UserWallet;
use App\Models\WalletTransactionHistory;

class WalletService
{
    public function feed(UserWallet $wallet, $points)
    {
        $oldPoints = $wallet->points;
        $wallet->update([
            'points' => $oldPoints + $points,
        ]);
        $newPoints = $wallet->points;
        return $this->updateWalletTransaction($wallet, WalletTransactionHistory::FEED, $oldPoints, $newPoints);
    }

    public function exchange(UserWallet $wallet, $points)
    {
        $oldPoints = $wallet->points;
        $wallet->update([
            'points' => $oldPoints - $points,
        ]);
        $newPoints = $wallet->points;
        return $this->updateWalletTransaction($wallet, WalletTransactionHistory::EXCHANGE, $oldPoints, $newPoints);
    }

    public function updateWalletTransaction(UserWallet $wallet, $transactionType, $oldPoints, $newPoints, $courseHistory = null)
    {
        return WalletTransactionHistory::create([
            'user_wallet_id' => $wallet->id,
            'course_history_id' => $courseHistory,
            'type' => $transactionType,
            'points_before' => $oldPoints,
            'points_after' => $newPoints,
        ]);
    }
}
