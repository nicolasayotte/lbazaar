<?php

namespace App\Repositories;

use App\Models\Course;
use App\Models\CourseFeedback;
use Carbon\Carbon;
use DateTime;

class CourseFeedbackRepository extends BaseRepository
{
    const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new CourseFeedback());
    }

    public function findByCourseId($id)
    {
        return $this->model->with(['user'])->where('course_id', $id)->orderBy('id', 'DESC')->paginate(self::PER_PAGE);
    }

    public function loadByCourseId($id, $take)
    {
        return $this->model
                    ->with(['user'])
                    ->take($take)
                    ->where('course_id', $id)
                    ->orderBy('rating', 'DESC')
                    ->orderBy('created_at', "DESC")
                    ->get();
    }

    public function findByCourseIdAndSearch($id, $filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model->with(['user'])
        ->where('course_id', $id)
        ->when(@$filters['keyword'], function ($q) use ($filters)  {
            return $q->whereHas('user', function($query) use ($filters) {
                return $query->whereRaw("CONCAT(`first_name`, ' ', `last_name`) LIKE ?", ['%'. @$filters['keyword'] .'%']);
            });

        })
        ->orderBy($sortBy, $sortOrder)
        ->paginate(self::PER_PAGE);
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
