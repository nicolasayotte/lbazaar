<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserWorkHistory extends Model
{
    use HasFactory;

    public function getStartDateAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }

    public function getEndDateAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }
}
