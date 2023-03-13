<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
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

    protected $appends = [
        'course_name',
        'transaction_datetime',
    ];

    public function courseHistory()
    {
        return $this->hasOne(CourseHistory::class, 'id', 'course_history_id');
    }

    public function getCourseNameAttribute()
    {
        return $this->courseHistory()->first()->course()->first()->title;
    }

    public function getTransactionDatetimeAttribute()
    {
        return Carbon::parse($this->created_at, 'Asia/Tokyo')->format('M d Y h:i A');
    }
}
