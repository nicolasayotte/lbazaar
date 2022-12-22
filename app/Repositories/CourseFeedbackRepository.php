<?php

namespace App\Repositories;

use App\Models\Course;
use App\Models\CourseFeedback;
use Carbon\Carbon;
use DateTime;

class CourseFeedbackRepository extends BaseRepository
{
    const PERPAGE = 5;

    public function __construct()
    {
        parent::__construct(new CourseFeedback());
    }

    public function findByCourseId($id)
    {
        return $this->model->with(['user'])->where('course_id', $id)->orderBy('id', 'DESC')->paginate();
    }
}
