<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserExam extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'user_id',
        'course_schedule_id',
        'total_score',
        'is_passed'
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function course()
    {
        return $this->hasOneThrough(
            Course::class,
            Exam::class,
            'id',
            'id',
            'exam_id',
            'course_id'
        );
    }

    public function answers()
    {
        return $this->hasMany(UserExamAnswer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
