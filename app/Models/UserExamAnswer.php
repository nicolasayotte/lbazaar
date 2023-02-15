<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserExamAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_exam_id',
        'exam_item_id',
        'exam_item_choice_id',
        'is_correct'
    ];
}
