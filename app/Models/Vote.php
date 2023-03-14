<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

    public const DEFAULT_EMOJI = "👍";

    public const PASSING_PERCENTAGE = 75;

    protected $fillable = [
        'description',
        'end_date',
        'counted_option',
        'approved_at',
        'denied_at',
        'data',
        'result_data',
        'voteable_type',
        'voteable_id'
    ];

    protected $appends = [
        'is_approved',
        'is_denied'
    ];

    public function voteable()
    {
        return $this->morphTo(__FUNCTION__, 'voteable_type', 'voteable_id');
    }

    public function getIsApprovedAttribute()
    {
        return $this->approved_at != null;
    }

    public function getIsDeniedAttribute()
    {
        return $this->denied_at != null;
    }
}
