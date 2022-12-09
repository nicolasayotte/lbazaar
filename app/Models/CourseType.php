<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseType extends Model
{
    use HasFactory;

    public const GENERAL = 'General';
    public const FREE    = 'Free';
    public const EARN    = 'Earn';
    public const SPECIAL = 'Special';
}
