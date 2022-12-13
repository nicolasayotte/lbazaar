<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

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
}
