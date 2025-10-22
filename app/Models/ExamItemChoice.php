<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExamItemChoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'exam_item_id',
        'value',
        'sort'
    ];
}
