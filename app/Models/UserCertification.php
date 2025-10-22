<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCertification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'awarded_at',
        'awarded_by',
        'user_id',
    ];

    public function getAwardedAtAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }
}
