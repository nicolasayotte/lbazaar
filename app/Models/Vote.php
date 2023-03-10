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
        'result_data'
    ];
}
