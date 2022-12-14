<?php

namespace App\Repositories;

use App\Models\CourseContent;
use Carbon\Carbon;

class CourseContentRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CourseContent());
    }

    public function getUpcomingCourseContent($take = 5)
    {
        return $this->model->where('schedule_datetime', '>=', Carbon::now('Asia/Tokyo'))->take($take)->orderBy('id', 'desc')->with('professor')->get();
    }

}
