<?php

namespace App\Repositories;

use App\Models\Course;

class CourseRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new Course());
    }

    public function getFeaturedClass($take = 5)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor'])->get();
    }

    public function getUpcomingClasses($take = 5)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor'])->get();
    }

}
