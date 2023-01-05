<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseContent extends Model
{
    use HasFactory;

    const COMING_SOON_COUNT_DISPLAY = 4;

    public function professor()
    {
        return $this->hasOneThrough(User::class, Course::class, 'id', 'id', 'course_id', 'professor_id');
    }

    public function courseType()
    {
        return $this->hasOneThrough(CourseType::class, Course::class, 'id', 'id', 'course_id', 'course_type_id');
    }

    public function courseCategory()
    {
        return $this->hasOneThrough(CourseCategory::class, Course::class, 'id', 'id', 'course_id', 'course_category_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
