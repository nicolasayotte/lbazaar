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

    public function updateOrCreate($user_id, $course_id, $form)
    {
        return $this->model->updateOrCreate(
            ['user_id' => $user_id, 'course_id' => $course_id],
            ['rating' => $form['rating'], 'comments' => $form['comments']]
        );
    }

    public function findByUserAndCourseID($user_id, $course_id)
    {
        $courseFeedback = $this->model->where('user_id', $user_id)->where('course_id', $course_id)->first();
        return $courseFeedback != null ?  $courseFeedback : new CourseFeedback();
    }

    public function isUserHasFeedback($user_id, $course_id)
    {
        return $this->model->where('user_id', $user_id)->where('course_id', $course_id)->exists();
    }
}
