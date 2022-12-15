<?php

namespace App\Repositories;

use App\Models\CourseType;
use Carbon\Carbon;

class CourseTypeRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CourseType());
    }
}
