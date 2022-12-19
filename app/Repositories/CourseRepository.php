<?php

namespace App\Repositories;

use App\Models\Course;

class CourseRepository extends BaseRepository
{
    const PERPAGE = 5;

    public function __construct()
    {
        parent::__construct(new Course());
    }

    public function getFeaturedClass($take = self::PERPAGE)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor'])->get();
    }

    public function getUpcomingClasses($take = self::PERPAGE)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor'])->get();
    }

    public function getLanguages()
    {
        return array_values($this->model->select('language')->distinct()->get()->toArray());
    }

    public function search($request)
    {
        return $this->model->with(['professor', 'contents'])
            ->when($request->has('search_text') && !empty($request->get('search_text')), function ($q) use ($request)  {
                return $q->where('title', 'like', '%' . $request->get('search_text') . '%')
                         ->orWhere('description', 'like', '%' . $request->get('search_text') . '%');
            })
            ->when($request->has('professor_id') && !empty($request->get('professor_id')), function ($q) use ($request)  {
                return $q->where('professor_id', $request->get('professor_id'));
            })
            ->when($request->has('type_id') && !empty($request->get('type_id')), function ($q) use ($request)  {
                return $q->where('course_type_id', $request->get('type_id'));
            })
            ->when($request->has('category_id') && !empty($request->get('category_id')), function ($q) use ($request)  {
                return $q->where('course_category_id', $request->get('category_id'));
            })
            ->when($request->has('language') && !empty($request->get('language')), function ($q) use ($request)  {
                return $q->where('language', $request->get('language'));
            })
            ->when($request->has('year') && !empty($request->get('year')), function ($q) use ($request)  {
                return $q->whereHas('contents', function($query) use ($request) {
                    return $query->whereYear('schedule_datetime', $request->get('year'));
                });
            })
            ->when($request->has('month') && !empty($request->get('month')), function ($q) use ($request)  {
                return $q->whereHas('contents', function($query) use ($request) {
                    return $query->whereMonth('schedule_datetime', $request->get('month') + 1);
                });
            })
            ->paginate(self::PERPAGE)->withQueryString();
    }

}
