<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id',
        'question',
        'correct_choice_id',
        'points'
    ];
}
