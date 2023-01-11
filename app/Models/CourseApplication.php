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
        return $this->belongsTo(CourseCategory::class);
    }
}
