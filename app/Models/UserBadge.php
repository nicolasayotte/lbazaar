<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
class UserBadge extends Model
{
    use HasFactory;

    protected $fillable = [
        'badge_id',
        'user_id',
        'course_package_id',
        'course_history_id',
    ];

    protected $appends = [
        'name',
        'type',
        'formatted_datetime',
    ];

    public function badgeInfo()
    {
        return $this->belongsTo(Badge::class, 'badge_id', 'id');
    }

    public function getNameAttribute()
    {
        return $this->badgeInfo()->first()->name;
    }

    public function getTypeAttribute()
    {
        return $this->badgeInfo()->first()->type;
    }

    public function getFormattedDatetimeAttribute()
    {
        return Carbon::parse($this->created_at, 'Asia/Tokyo')->format('l M d Y h:i A');
    }

}
