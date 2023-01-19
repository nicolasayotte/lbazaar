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

    public const GENERAL_ID = 1;
    public const FREE_ID    = 2;
    public const EARN_ID    = 3;
    public const SPECIAL_ID = 4;
}
