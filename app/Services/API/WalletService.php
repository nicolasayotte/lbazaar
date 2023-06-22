<?php

namespace App\Services\API;
use App\Models\UserWallet;
use App\Models\WalletTransactionHistory;

class WalletService
{
    public function feed(UserWallet $wallet, $points, $txId, $status)
    {
        $oldPoints = $wallet->points;
        // Only update the user wallet table if the web3 tx
        // has been confirmed
        if ($status == 'confirmed') {
            $wallet->update([
                'points' => $oldPoints + $points,
            ]);
            $new_points = $oldPoints + $points;
        }
        
        $newPoints = $wallet->points;
        return $this->updateWalletTransaction($wallet, WalletTransactionHistory::FEED, $oldPoints, $newPoints, $txId, $status);
    }

    public function exchange(UserWallet $wallet, $points, $txId, $status)
    {
        $oldPoints = $wallet->points;
        $wallet->update([
            'points' => $oldPoints - $points,
        ]);
        $newPoints = $oldPoints - $points;
        return $this->updateWalletTransaction($wallet, WalletTransactionHistory::EXCHANGE, $oldPoints, $newPoints, $txId, $status);
    }

    public function updateWalletTransaction(UserWallet $wallet, $transactionType, $oldPoints, $newPoints, $txId, $status, $courseHistory = null)
    {
        if ($status == 'pending') {

            return WalletTransactionHistory::create([
                'user_wallet_id' => $wallet->id,
                'course_history_id' => $courseHistory,
                'type' => $transactionType,
                'points_before' => $oldPoints,
                'points_after' => $newPoints,
                'tx_id' => $txId,
                'status' => $status
            ]);
        } else if ($status == 'confirmed') {

            $walletTransHistory = WalletTransactionHistory::where('tx_id', $txId)->first();
            $walletTransHistory->points_before = $oldPoints;
            $walletTransHistory->points_after = $newPoints;
            $walletTransHistory->status = 'confirmed';
            $walletTransHistory->save();
            
            return $walletTransHistory;
        }
    }
}
