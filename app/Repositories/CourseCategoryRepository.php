<?php

namespace App\Repositories;

use App\Models\CourseCategory;
use Carbon\Carbon;

class CourseCategoryRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CourseCategory());
    }
}
