<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Exam extends Model
{
    use HasFactory, SoftDeletes;

    public const PER_PAGE = 10;

    protected $fillable = [
        'name',
        'course_id',
        'published_at'
    ];

    protected $appends = [
        'total_points'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function items()
    {
        return $this->hasMany(ExamItem::class);
    }

    public function userExams()
    {
        return $this->hasMany(UserExam::class);
    }

    public function getTotalPointsAttribute()
    {
        $totalPoints = 0;

        $items = $this->items()->get();

        foreach ($items as $item) {
            $totalPoints += $item->points;
        }

        return $totalPoints;
    }
}
