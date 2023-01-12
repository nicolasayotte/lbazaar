<?php

namespace App\Repositories;

use App\Data\CourseHistoryData;
use App\Models\CourseHistory;
use Illuminate\Support\Facades\Auth;

class CourseHistoryRepository extends BaseRepository
{
    const PER_PAGE = 5;

    const SORT_TEACHER = 'first_name';

    public function __construct()
    {
        parent::__construct(new CourseHistory());
    }

    public function search($request, $user_id)
    {

        if ($request->get('sort')) {
            $sortFilterArr = explode(':', $request->get('sort'));

            $sortBy = $sortFilterArr[0];
            $sortOrder = $sortFilterArr[1];
        } else {
            $sortBy = 'course_histories.created_at';
            $sortOrder = 'desc';
        }

        return $this->model
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
}
