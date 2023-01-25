<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    const FEATURED_CLASS_COUNT_DISPLAY = 3;

    const PER_PAGE = 10;

    public function professor()
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function courseType()
    {
        return $this->belongsTo(CourseType::class);
    }

    public function courseCategory()
    {
        return $this->belongsTo(CourseCategory::class)->withTrashed();
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function contents()
    {
        return $this->hasMany(CourseContent::class);
    }

    public function feedbacks()
    {
        return $this->hasMany(CourseFeedback::class)->orderBy('created_at', 'desc');
    }

    public function getPriceAttribute($value) {
        if (@$value) {
            return number_format($value, 2);
        }
    }
}
