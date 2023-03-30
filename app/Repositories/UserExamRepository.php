<?php

namespace App\Repositories;

use App\Models\UserExam;

class UserExamRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new UserExam());
    }
}
