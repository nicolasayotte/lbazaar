<?php

namespace App\Repositories;

use App\Models\CourseHistory;
use App\Models\CourseSchedule;
use App\Models\Status;
use Carbon\Carbon;
use DateTime;
use Illuminate\Support\Facades\DB;

class CourseScheduleRepository extends BaseRepository
{
    const PER_PAGE = 10;

    public function __construct()
    {
        parent::__construct(new CourseSchedule());
    }

    public function getUpcomingCourseSchedule($take = self::PER_PAGE)
    {
        return $this->model
                    ->with(['course', 'course.professor', 'course.courseType', 'course.courseCategory'])
                    ->where('start_datetime', '>=', Carbon::now('Asia/Tokyo'))
                    ->take($take)
                    ->orderBy('id', 'desc')
                    ->get();
    }

    public function get($courseID, $filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'start_datetime:asc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model->with(['course'])
            ->where('course_id', $courseID)
            ->when(@$filters['month'], function($q) use ($filters) {

                $startDate = date('Y-m-d', strtotime($filters->get('month') . '-01'));
                $endDate   = date('Y-m-t', strtotime($startDate));

                return $q->whereBetween('start_datetime', [
                    $startDate,
                    $endDate
                ]);
            })
            ->when(@$filters['status'], function($q) use($filters) {

                // Upcoming
                if ($filters['status'] == Status::UPCOMING) {
                    return $q->whereDate('start_datetime', '>', new DateTime());
                }

                // Done
                if (@$filters['status'] == Status::DONE) {
                    return $q->whereDate('end_datetime', '<', new DateTime());
                }

                // Ongoing
                if ($filters['status'] == Status::ONGOING) {
                    return $q->whereDate('start_datetime', '<=', new DateTime())
                            ->whereDate('end_datetime', '>=', new DateTime());
                }
            })
            ->orderBy($sortBy, $sortOrder)
            ->paginate(self::PER_PAGE)->withQueryString();
    }

    public function getStudents($scheduleID, $filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'fullname:asc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return CourseHistory::with(['user.exams', 'user.feedbacks'])
                    ->select([
                        'users.id',
                        'users.id as user_id',
                        'users.first_name',
                        'users.last_name',
                        'users.email',
                        'course_histories.created_at',
                        DB::raw('CONCAT(users.first_name, " ", users.last_name) as fullname')
                    ])
                    ->join('users', 'users.id', '=', 'course_histories.user_id')
                    ->whereHas('courseSchedule', function($q) use($scheduleID) {
                        return $q->where('course_schedules.id', $scheduleID);
                    })
                    ->when(@$filters['keyword'], function($q) use($filters) {
                        return $q->whereRaw("CONCAT(`first_name`, ' ', `last_name`) LIKE ?", ['%'. @$filters['keyword'] .'%'])
                        ->orWhere('email', 'LIKE', '%'. @$filters['keyword'] .'%');
                    })
                    ->where('course_histories.course_schedule_id', $scheduleID)
                    ->where(function($q) {
                        return $q->where('is_cancelled', null)
                                ->orWhere('is_cancelled', 0);
                    })
                    ->orderBy($sortBy, $sortOrder)
                    ->paginate(self::PER_PAGE);
    }

    public function findStudentBySchedule($scheduleID, $studentID)
    {
        $courseHistory = CourseHistory::with([
                                            'user',
                                            'user.courses',
                                            'user.createdCourses',
                                            'user.userEducation',
                                            'user.userCertification',
                                            'user.userWorkHistory',
                                            'user.roles',
                                            'user.country'
                                        ])
                                        ->where('course_schedule_id', $scheduleID)
                                        ->where('user_id', $studentID)
                                        ->firstOrFail();

        return $courseHistory->user;
    }

    public function findByCourseId($id)
    {
        return $this->model
                    ->with(['course', 'course.courseType', 'course.courseCategory', 'courseHistory'])
                    ->where('course_id', $id)
                    ->where('is_completed', 0)
                    ->orderBy('start_datetime', 'ASC')
                    ->get();
    }

    public function getScheduledDates($id)
    {
        $courseSchedules = $this->model->where('course_id', $id)->get();

        $scheduledDates = [];

        if ($courseSchedules->count() > 0) {
            foreach ($courseSchedules as $schedule) {
                $scheduledDates[] = Carbon::parse($schedule->start_datetime)->format('Y-m-d');
            }
        }

        return $scheduledDates;
    }
}
