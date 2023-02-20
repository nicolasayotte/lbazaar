<?php

namespace App\Repositories;

use App\Models\CourseSchedule;
use Carbon\Carbon;

class CourseScheduleRepository extends BaseRepository
{
    const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new CourseSchedule());
    }

    public function getUpcomingCourseSchedule($take = self::PER_PAGE)
    {
        return $this->model->where('start_datetime', '>=', Carbon::now('Asia/Tokyo'))->take($take)->orderBy('id', 'desc')->with(['course', 'professor', 'courseType', 'courseCategory'])->get();
    }

    public function get($courseID, $filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model->with(['professor', 'course'])
            ->where('course_id', $courseID)
            ->when($filters->has('month') && !empty($filters->get('month')), function ($q) use ($filters)  {
                return $q->whereHas('contents', function($query) use ($filters) {

                    $startDate = date('Y-m-d', strtotime($filters->get('month') . '-01'));
                    $endDate   = date('Y-m-t', strtotime($startDate));

                    return $query->whereBetween('start_datetime', [
                        $startDate,
                        $endDate
                    ]);
                });
            })
            ->orderBy($sortBy, $sortOrder)
            ->paginate(self::PER_PAGE)->withQueryString();
    }

    public function findByCourseId($id)
    {
        return $this->model->where('course_id', $id)->orderBy('start_datetime', 'ASC')->with(['course'])->get();
    }
}
