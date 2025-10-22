<?php

namespace App\Models;

use Laratrust\Models\LaratrustRole;

class Role extends LaratrustRole
{
    public $guarded = [];

    public const STUDENT = 'student';
    public const TEACHER = 'teacher';
    public const ADMIN   = 'admin';
}
