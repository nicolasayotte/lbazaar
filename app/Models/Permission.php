<?php

namespace App\Models;

use Laratrust\Models\LaratrustPermission;

class Permission extends LaratrustPermission
{
    public $guarded = [];

    public const ACTIONS = ['create', 'edit', 'delete', 'read'];

    public const SCOPES = [
        'courses',
        'course-applications',
        'users',
        'feedbacks',
        'class-histories',
        'settings',
        'inquiries',
        'exams',
        'course-categories'
    ];
}
