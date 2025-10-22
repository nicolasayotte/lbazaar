<?php

namespace App\Services\API;
use App\Models\UserWallet;
use App\Models\WalletTransactionHistory;

class WalletService
{
    public function feed(UserWallet $wallet, $points, $txId, $status)
    { 
        // Only update the user wallet table if the tx has been confirmed
        if ($status == 'pending') {
            $oldPoints = $wallet->points;
            $newPoints = $oldPoints + $points;
            return $this->updateWalletTransaction($wallet, WalletTransactionHistory::FEED, $oldPoints, $newPoints, $txId, $status);
        
        } else if ($status == 'confirmed') {
            $oldPoints = $wallet->points;
            $newPoints = $oldPoints + $points;
            $wallet->update([
                'points' => $newPoints,
            ]);
            $wallet->save();
            return $this->updateWalletTransaction($wallet, WalletTransactionHistory::FEED, $oldPoints, $newPoints, $txId, $status);
        } 
    }

    public function exchange(UserWallet $wallet, $points, $txId, $status)
    {
        // Update the user wallet table and undo the tx for rollback
        if ($status == 'pending') {
            $oldPoints = $wallet->points;
            $newPoints = $oldPoints - $points;
            $wallet->update([
                'points' => $newPoints,
            ]);
            $wallet->save();
            return $this->updateWalletTransaction($wallet, WalletTransactionHistory::EXCHANGE, $oldPoints, $newPoints, $txId, $status);
        
        } else if ($status == 'confirmed') {
            $newPoints = $wallet->points;
            $oldPoints = $newPoints + $points;
            return $this->updateWalletTransaction($wallet, WalletTransactionHistory::EXCHANGE, $oldPoints, $newPoints, $txId, $status);
        } 
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
            $walletTransHistory->status = $status;
            $walletTransHistory->save();
            return $walletTransHistory;
        }
    }
}
