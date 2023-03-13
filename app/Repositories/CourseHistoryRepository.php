<?php

namespace App\Repositories;

use App\Data\CourseHistoryData;
use App\Data\CourseManageStudentData;
use App\Models\Badge;
use App\Models\CourseHistory;
use Illuminate\Support\Facades\Auth;

class CourseHistoryRepository extends BaseRepository
{
    const PER_PAGE = 10;

    const SORT_TEACHER = 'first_name';

    public function __construct()
    {
        parent::__construct(new CourseHistory());
    }

    public function search($request, $user_id)
    {

        $sortFilterArr = explode(':', @$request->get('sort') ?? 'course_histories.created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];
        // return $this->model->select('course_histories.course_id as course_histories_course_id', 'course_histories.user_id as course_histories_user_id', 'course_histories.id as course_histories_id', 'course_histories.completed_at as course_histories_completed_at', 'course_histories.is_cancelled as course_histories_is_cancelled', 'course_histories.is_watched as course_histories_is_watched' , 'courses.*', 'users.*', 'course_types.*', 'course_categories.*')
        return $this->model->select('*','course_histories.id as id')
           ->where('user_id', $user_id)
            ->when($request->has('professor_id') && !empty($request->get('professor_id')), function ($q) use ($request)  {
                return $q->where('courses.professor_id', $request->get('professor_id'));
            })
            ->when($request->has('type_id') && !empty($request->get('type_id')), function ($q) use ($request)  {
                return $q->where('courses.course_type_id', $request->get('type_id'));
            })
            ->when($request->has('category_id') && !empty($request->get('category_id')), function ($q) use ($request)  {
                return $q->where('courses.course_category_id', $request->get('category_id'));
            })
            ->when($request->has('language') && !empty($request->get('language')), function ($q) use ($request)  {
                return $q->where('courses.language', $request->get('language'));
            })
            ->when($request->has('month') && !empty($request->get('month')), function ($q) use ($request)  {
                $startDate = date('Y-m-d', strtotime($request->get('month') . '-01'));
                $endDate   = date('Y-m-t', strtotime($startDate));
                return $q->whereBetween('course_histories.created_at', [
                    $startDate,
                    $endDate
                ]);
            })
            ->when($request->has('status') && !empty($request->get('status')), function ($q) use ($request)  {
                return $q->{$request->get('status') == CourseHistory::COMPLETED ? 'whereNotNull' : 'whereNull'}('course_histories.completed_at');
            })
            ->when($request->has('keyword') && !empty($request->get('keyword')), function ($q) use ($request)  {
                return  $q->where(function($query) use ($request){
                    $query->where('courses.title', 'like', '%' . $request->get('keyword') . '%')
                        ->orWhere('courses.description', 'like', '%' . $request->get('keyword') . '%')
                        ->orWhere('users.first_name', 'like', '%' . $request->get('keyword') . '%')
                        ->orWhere('users.last_name', 'like', '%' . $request->get('keyword') . '%');
                });
            })
            ->join('courses', 'courses.id', '=', 'course_histories.course_id')
            ->join('users', 'users.id', '=', 'courses.professor_id')
            ->join('course_types', 'course_types.id', '=', 'courses.course_type_id')
            ->join('course_categories', 'course_categories.id', '=', 'courses.course_category_id')
            ->orderBy($sortBy, $sortOrder)
            ->paginate(self::PER_PAGE)->withQueryString()
            ->through(function($histories) {
                return CourseHistoryData::fromModel($histories);
            });
    }

    public function searchEnrolledStudents($request, $course_id)
    {
        $sortFilterArr = explode(':', @$request->get('sort') ?? 'course_histories.created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model->select('users.first_name', 'users.last_name', 'course_histories.*')
        ->where('course_id', $course_id)
        ->when($request->has('keyword') && !empty($request->get('keyword')), function ($query) use ($request)  {
            return $query->where( function($q) use($request){
                return $q->whereRaw("CONCAT(`first_name`, ' ', `last_name`) LIKE ?", ['%'. $request->get('keyword') .'%'])
                         ->orWhere('email', 'LIKE', '%'. $request->get('keyword') .'%');
            });
        })
        ->join('users', 'users.id', '=', 'course_histories.user_id')
        ->orderBy($sortBy, $sortOrder)
        ->paginate(self::PER_PAGE)->withQueryString()
        ->through(function($histories) {
            return CourseManageStudentData::fromModel($histories);
        });
    }

    public function isUserBookedCourse($user_id, $course_id)
    {
        return $this->model->where('course_id', $course_id)->where('user_id', $user_id)->exists();
    }

    public function findByUserAndCourseScheduleID($user_id, $course_schedule_id)
    {
        $courseHistory = $this->model->where('user_id', $user_id)->where('course_schedule_id', $course_schedule_id)->where('is_cancelled', null)->get();
        return $courseHistory != null ?  $courseHistory : [];
    }

    public function findByCourseScheduleID($course_schedule_id)
    {
        $courseHistory = $this->model->where('course_schedule_id', $course_schedule_id)->where('is_cancelled', false)->get();
        return $courseHistory != null ?  $courseHistory : [];
    }

    public function findByCourseId($courseId)
    {
        return $this->model
                    ->where('user_id', auth()->user()->id)
                    ->where('course_id', $courseId)
                    ->first();
    }

    public function feedBadge($courseHistoryId)
    {
        $courseHistory = $this->with(['course', 'course.coursePackage', 'course.coursePackage.courses'])->findOrFail($courseHistoryId);

        if (!@$courseHistory->course->coursePackage) {
            $badge = Badge::where([
                'name' => Badge::COMPLETION . ' - ' . $courseHistory->course->title,
                'type' => 'student',
            ])->first();

            if(!isset($badge->id)) {
                $badge = Badge::create([
                    'name' => Badge::COMPLETION . ' - ' . $courseHistory->course->title,
                    'type' => 'student',
                ]);
            }

            auth()->user()->badges()->create([
                'badge_id' => $badge->id,
                'course_history_id' => $courseHistory->id,
            ]);

            return true;
        }

        if (
            $courseHistory->course->coursePackage &&
            $courseHistory->course->coursePackage->courses &&
            $courseHistory->course->coursePackage->courses->count() > 0
        ) {

            $packageCoursesCompleted = 0;

            foreach ($courseHistory->course->coursePackage->courses as $course) {

                $booking = $this->findByCourseId($course->id);

                if (@$booking && @$booking->completed_at != null) {
                    $packageCoursesCompleted++;
                }
            }

            // Check if completed all package courses
            if ($packageCoursesCompleted == $courseHistory->course->coursePackage->courses->count()) {
                $badge = Badge::where([
                    'name' => Badge::COMPLETION . ' - ' . $courseHistory->course->coursePackage->name,
                    'type' => 'student',
                ])->first();

                if(!isset($badge->id)) {
                    $badge = Badge::create([
                        'name' => Badge::COMPLETION . ' - ' . $courseHistory->course->coursePackage->name,
                        'type' => 'student',
                    ]);
                }


                auth()->user()->badges()->create([
                    'badge_id' => $badge->id,
                    'course_package_id' => $courseHistory->course->coursePackage->id,
                ]);
            }
        }

        return false;
    }
}
