<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StripePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'course_history_id',
        'stripe_payment_intent_id',
        'stripe_customer_id',
        'amount',
        'currency',
        'status',
        'receipt_url',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'amount' => 'integer',
    ];

    protected $hidden = [
        'stripe_payment_intent_id',
        'stripe_customer_id',
        'metadata',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function courseHistory()
    {
        return $this->belongsTo(CourseHistory::class);
    }
}
