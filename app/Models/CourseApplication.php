<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseApplication extends Model
{
    use HasFactory;

    public const PENDING = 'pending';

    public const APPROVED = 'approved';

    public const DENIED = 'denied';

    public const APPROVE = 'approve';

    public const DENY = 'deny';

    public const PER_PAGE = 10;

    protected $appends = ['status'];

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
}
