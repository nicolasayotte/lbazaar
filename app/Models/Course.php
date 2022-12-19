<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    const FEATURED_CLASS_COUNT_DISPLAY = 3;

    public function professor()
    {
        return $this->belongsTo(User::class, 'professor_id');
    }

    public function courseType()
    {
        return $this->hasOne(CourseType::class);
    }

    public function courseCategory()
    {
        return $this->hasOne(CourseCategory::class);
    }

    public function contents()
    {
        return $this->hasMany(CourseContent::class);
    }
    
    public function feedbacks()
    {
        return $this->hasMany(CourseFeedback::class);
    }
}
