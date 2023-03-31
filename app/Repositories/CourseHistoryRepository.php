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

        return $this->model->select('*','course_histories.id as id')
            ->where('user_id', $user_id)
            ->when($request->has('is_cancelled'), function ($q) use ($request)  {
                return $q->where('course_histories.is_cancelled', $request->get('is_cancelled'));
            })
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

    public function findByCourseIdAndIsCompleted($courseId)
    {
        return $this->model
                    ->where('user_id', auth()->user()->id)
                    ->where('course_id', $courseId)
                    ->where('completed_at','!=', null)
                    ->get();

    }

    public function feedBadge($courseHistoryId)
    {
        $courseHistory = $this->with(['course', 'course.coursePackage', 'course.coursePackage.courses'])->findOrFail($courseHistoryId);

        if (!@$courseHistory->course->coursePackage) {

            $userExams = auth()->user()->exams()->where('course_schedule_id', $courseHistory->course_schedule_id)->count();
            $userPassedExams = auth()->user()->exams()->where(['course_schedule_id' => $courseHistory->course_schedule_id, 'is_passed' => 1])->count();

            if ($userExams != $userPassedExams) {
                return false;
            }

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

            $userBadgeExist = auth()->user()->badges()->where('badge_id', $badge->id)->first();
            if($userBadgeExist == null) {
                auth()->user()->badges()->create([
                    'badge_id' => $badge->id,
                    'course_history_id' => $courseHistory->id,
                ]);

                return true;
            }
        }

        if (
            $courseHistory->course->coursePackage &&
            $courseHistory->course->coursePackage->courses &&
            $courseHistory->course->coursePackage->courses->count() > 0
        ) {
            $packageCoursesCompleted = 0;
            $isPassedCoursesExam = array();

            foreach ($courseHistory->course->coursePackage->courses as $course) {

                $bookingsCompleted = $this->findByCourseIdAndIsCompleted($course->id);
                $isPassedCourseBookingsExam = array();

                if (count($bookingsCompleted) > 0) {
                    $packageCoursesCompleted++;
                }

                foreach ($bookingsCompleted as $booking) {

                    $schedule = $booking->courseSchedule()->first();
                    $userExams = auth()->user()->exams()->where(['course_schedule_id' => $schedule->id])->count();
                    $userPassedExams = auth()->user()->exams()->where(['course_schedule_id' => $schedule->id, 'is_passed' => 1])->count();

                    array_push($isPassedCourseBookingsExam, $userExams == $userPassedExams);
                }

                $isPassedCourseExams = array_reduce($isPassedCourseBookingsExam, function ($carry, $examResult) {
                    return $carry || $examResult;
                }, false);

                array_push($isPassedCoursesExam, $isPassedCourseExams);
            }

            $isPassedCourses = array_reduce($isPassedCoursesExam, function ($carry, $examResult) {
                return $carry && $examResult;
            }, true);

            // Check if completed all package courses and passed all exams
            if ($packageCoursesCompleted == $courseHistory->course->coursePackage->courses->count() && $isPassedCourses) {
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
                $userBadgeExist = auth()->user()->badges()->where('badge_id', $badge->id)->first();
                if($userBadgeExist == null) {
                    auth()->user()->badges()->create([
                        'badge_id' => $badge->id,
                        'course_package_id' => $courseHistory->course->coursePackage->id,
                    ]);

                    return true;
                }
            }
        }
        return false;
    }
}
