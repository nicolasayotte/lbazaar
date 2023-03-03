<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WalletTransactionHistory extends Model
{
    use HasFactory;

    public const DEDUCT = 'deduct';
    public const FEED = 'feed';
    public const EXCHANGE = 'exchange';
    public const EARN = 'earn';
    public const COMMISSION = 'commision';
    public const BOOK = 'book';
    public const REFUND = 'refund';

    protected $fillable = [
        'user_wallet_id',
        'course_history_id',
        'type',
        'points_before',
        'points_after',
    ];
}
