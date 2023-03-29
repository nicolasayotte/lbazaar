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

    public const DONATE = 'donate';

    public const SCHEDULE_FEE = 'schedule fee';
    protected $fillable = [
        'user_wallet_id',
        'course_history_id',
        'course_schedule_id',
        'user_id',
        'type',
        'points_before',
        'points_after',
    ];

    protected $appends = [
        'course_name',
        'transaction_datetime',
        'transaction_details',
        'amount',
    ];

    public function courseHistory()
    {
        return $this->hasOne(CourseHistory::class, 'id', 'course_history_id');
    }

    public function courseSchedule()
    {
        return $this->hasOne(CourseSchedule::class, 'id', 'course_schedule_id');
    }
    public function getCourseNameAttribute()
    {
        if($this->courseHistory()->first() != null)
        {
            return $this->courseHistory()->first()->course()->first()->title;
        } else if ($this->courseSchedule()->first() != null) {
            return $this->courseSchedule()->first()->course()->first()->title;
        }

        return "";
    }

    public function getTransactionDatetimeAttribute()
    {
        return Carbon::parse($this->created_at, 'Asia/Tokyo')->format('M d Y h:i A');
    }

    public function getTransactionDetailsAttribute()
    {
       switch($this->type) {
            case(self::BOOK):
                $transactionDetails = getTranslation('texts.wallet_book_details') ." ". $this->getCourseNameAttribute();
                break;
            case(self::FEED):
                $transactionDetails = getTranslation('texts.wallet_feed_details');
                break;
            case(self::EXCHANGE):
                $transactionDetails = getTranslation('texts.wallet_exchange_details');
                break;
            case(self::EARN):
                $transactionDetails = getTranslation('texts.wallet_earn_details') ." ". $this->getCourseNameAttribute();
                break;
            case(self::COMMISSION):
                $transactionDetails = getTranslation('texts.wallet_commission_details') ." ". $this->getCourseNameAttribute();
                break;
            case(self::REFUND):
                $transactionDetails = getTranslation('texts.wallet_refund_details') ." ". $this->getCourseNameAttribute();
                break;
            case(self::SCHEDULE_FEE):
                $transactionDetails = getTranslation('texts.wallet_schedule_fee') ." ". $this->getCourseNameAttribute();
                break;
            case(self::DONATE):
                if($this->points_before > $this->points_after) {
                    $teacher = User::where('id', $this->user_id)->first()->toArray();
                    $transactionDetails = getTranslation('texts.wallet_donate_points_to') ." ". $teacher['fullname'];
                } else {
                    $user = User::where('id', $this->user_id)->first()->toArray();
                    $transactionDetails = getTranslation('texts.wallet_donate_points_from') ." ". $user['fullname'];
                }
                break;
            default:
                $transactionDetails = 'transaction type not exist';
        }

        return $transactionDetails;
    }

    public function getAmountAttribute()
    {
       if($this->points_before > $this->points_after) {
            $amount = "-".($this->points_before - $this->points_after);
       } else {
            $amount = "+".($this->points_after - $this->points_before);
       }

       return $amount;
    }
}

