<?php

namespace App\Repositories;

use App\Models\TeacherApplication;

class TeacherApplicationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new TeacherApplication());
    }
}
