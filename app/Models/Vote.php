<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vote extends Model
{
    use HasFactory;

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

    public function voteable()
    {
        return $this->morphTo(__FUNCTION__, 'voteable_type', 'voteable_id');
    }
}
