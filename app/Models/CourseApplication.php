<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CourseApplication extends Model
{
    use HasFactory, SoftDeletes;

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const DENIED = 'denied';

    public const APPROVE = 'approve';

    public const DENY = 'deny';

    public const PER_PAGE = 10;

    protected $appends = ['status'];

    protected $fillable = [
        'professor_id',
        'course_category_id',
        'course_type_id',
        'price',
        'points_earned',
        'title',
        'description',
        'max_participant',
        'is_live',
        'video_link',
        'zoom_link',
        'approved_at',
        'length',
        'lecture_frequency',
        'data'
    ];


    public function professor()
    {
        return $this->belongsTo(User::class);
    }

    public function courseType()
    {
        return $this->belongsTo(CourseType::class);
    }

    public function courseCategory()
    {
        return $this->belongsTo(CourseCategory::class)->withTrashed();
    }

    public function course()
    {
        return $this->hasOne(Course::class);
    }

    public function getStatusAttribute()
    {
        if (is_null($this->approved_at) && is_null($this->denied_at)) return self::PENDING;

        if (!is_null($this->approved_at)) return self::APPROVED;

        if (!is_null($this->denied_at)) return self::DENIED;
    }

    public function getCreatedAtAttribute($value)
    {
        return Carbon::parse($value)->format('M j, Y');
    }
}
