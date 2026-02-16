<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseHistory extends Model
{
    use HasFactory;

    const ONGOING   = "Ongoing";

    const COMPLETED = "Completed";

    protected $fillable = [
        'user_id',
        'course_id',
        'course_schedule_id',
        'completed_at',
        'is_cancelled',
        'is_watched',
        'certificate_status',
        'certificate_tx_hash',
        'certificate_minted_at',
        'payment_status',
        'payment_tx_hash',
        'payment_ada_amount',
        'payment_submitted_at',
        'payment_confirmed_at'
    ];

    protected $casts = [
        'certificate_minted_at' => 'datetime',
        'payment_submitted_at' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'payment_ada_amount' => 'decimal:6'
    ];

    public function courseSchedule()
    {
        return $this->belongsTo(CourseSchedule::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }
}
