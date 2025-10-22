<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserWallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'points',
        'badges',
        'credit',
        'stake_key_hash',
        'address',
    ];

    public function userWalletTransactions()
    {
        return $this->hasMany(WalletTransactionHistory::class, 'user_wallet_id', 'id');
    }
}
