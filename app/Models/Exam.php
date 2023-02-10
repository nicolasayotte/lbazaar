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

    public function items()
    {
        return $this->hasMany(ExamItem::class);
    }
}
