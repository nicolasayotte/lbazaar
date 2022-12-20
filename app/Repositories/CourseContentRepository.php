<?php

namespace App\Repositories;

use App\Models\CourseContent;
use Carbon\Carbon;

class CourseContentRepository extends BaseRepository
{
    const PERPAGE = 5;

    public function __construct()
    {
        parent::__construct(new CourseContent());
    }

    public function getUpcomingCourseContent($take = self::PERPAGE)
    {
        return $this->model->where('schedule_datetime', '>=', Carbon::now('Asia/Tokyo'))->take($take)->orderBy('id', 'desc')->with('professor')->get();
    }

    public function search($request)
    {
        return $this->model->with(['professor', 'course'])
            ->when($request->has('search_text') && !empty($request->get('search_text')), function ($q) use ($request)  {
                return $q->where('title', 'like', '%' . $request->get('search_text') . '%')
                         ->orWhere('description', 'like', '%' . $request->get('search_text') . '%');
            })
            ->when($request->has('professor_id') && !empty($request->get('professor_id')), function ($q) use ($request)  {
                return $q->whereHas('professor', function($query) use ($request) {
                    return $query->where('professor_id', $request->get('professor_id'));
                });
            })
            ->when($request->has('type_id') && !empty($request->get('type_id')), function ($q) use ($request)  {
                return $q->whereHas('course', function($query) use ($request) {
                    return $query->where('course_type_id', $request->get('type_id'));
                });
            })
            ->when($request->has('category_id') && !empty($request->get('category_id')), function ($q) use ($request)  {
                return $q->whereHas('course', function($query) use ($request) {
                    return $query->where('course_category_id', $request->get('category_id'));
                });
            })
            ->when($request->has('language') && !empty($request->get('language')), function ($q) use ($request)  {
                return $q->whereHas('course', function($query) use ($request) {
                    return $query->where('language', $request->get('language'));
                });
            })
            ->when($request->has('year') && !empty($request->get('year')), function ($q) use ($request)  {
                return $q->whereYear('schedule_datetime', $request->get('year'));
            })
            ->when($request->has('month') && !empty($request->get('month')), function ($q) use ($request)  {
                return $q->whereMonth('schedule_datetime', $request->get('month') + 1);
            })
            ->paginate(self::PERPAGE)->withQueryString();
    }

    public function findByCourseId($id)
    {
        return $this->model->where('course_id', $id)->orderBy('sort', 'ASC')->get();
    }
}
