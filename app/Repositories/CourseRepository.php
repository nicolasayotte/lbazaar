<?php

namespace App\Repositories;

use App\Data\CourseData;
use App\Data\CourseManageData;
use App\Http\Requests\CourseUpdateRequest;
use App\Models\Course;
use Carbon\Carbon;
use DateTime;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CourseRepository extends BaseRepository
{
    const PER_PAGE = 5;

    const STORAGE_THUMBNAIL_PATH = "thumbnail/";

    public function __construct()
    {
        parent::__construct(new Course());
    }

    public function getFeaturedClass($take = self::PER_PAGE)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor', 'courseType', 'courseCategory'])->get();
    }

    public function getUpcomingClasses($take = self::PER_PAGE)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor', 'courseType', 'courseCategory'])->get();
    }

    public function getLanguages()
    {
        return array_values($this->model->select('language')->distinct()->get()->toArray());
    }

    public function search($request)
    {
        return $this->model->with(['professor', 'contents', 'courseCategory', 'courseType'])
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
            ->when($request->has('month') && !empty($request->get('month')), function ($q) use ($request)  {
                return $q->whereHas('contents', function($query) use ($request) {

                    $startDate = date('Y-m-d', strtotime($request->get('month') . '-01'));
                    $endDate   = date('Y-m-t', strtotime($startDate));

                    return $query->whereBetween('schedule_datetime', [
                        $startDate,
                        $endDate
                    ]);
                });
            })
            ->when($request->has('search_text') && !empty($request->get('search_text')), function ($q) use ($request)  {
                return ($q->where('title', 'like', '%' . $request->get('search_text') . '%')
                         ->orWhere('description', 'like', '%' . $request->get('search_text') . '%'));
            })
            ->paginate(self::PER_PAGE)->withQueryString();
    }

    public function getMyCourses($filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'course_contents.schedule_datetime:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];


        return $this->model->select('statuses.*', 'courses.*', 'course_contents.schedule_datetime' )
            ->where('professor_id', Auth::user()->id)
            ->where(function($q) use($filters) {
                return $q->where('courses.title', 'LIKE', '%'. @$filters['keyword'] .'%');
            })
            ->when(@$filters['course_type'], function($q) use($filters) {
                return $q->where('course_type_id', @$filters['course_type']);
            })
            ->when(@$filters['category'], function($q) use($filters) {
                return $q->where('course_category_id', @$filters['category']);
            })
            ->when(@$filters['status'], function($q) use($filters) {
                return $q->where('statuses.name', $filters['status']);
            })
            ->join('statuses', 'statuses.id', '=', 'courses.status_id')
            ->join('course_contents', function ($join) {
                $join->on('course_contents.id', '=', DB::raw('(SELECT id FROM course_contents WHERE course_contents.course_id = courses.id LIMIT 1)'));
            })
            ->orderBy($sortBy, $sortOrder)
            ->paginate(self::PER_PAGE)->withQueryString()
            ->through(function($histories) {
                return CourseManageData::fromModel($histories);
            });
    }

    public function findById($id)
    {
        return $this->model->with(['professor', 'courseType', 'contents', 'courseCategory', 'feedbacks', 'feedbacks.user'])->findOrFail($id);
    }

    public function findByIdManageClass($id)
    {
        return CourseData::fromModel($this->model->with(['courseType', 'contents', 'courseCategory'])->findOrFail($id));
    }

    public function findByIdManageClassFeedbacks($id)
    {
        return $this->model->with(['feedbacks', 'feedbacks.user'])->findOrFail($id);
    }

    public function isMyCourseById($course_id)
    {
        return $this->model->whereId($course_id)->whereProfessorId(Auth::user()->id)->exists();
    }

    public function courseUpdate(CourseUpdateRequest $request)
    {
        $course = $this->findOrFail($request->get('id'));

        $course->title = $request->get('title');
        $course->description = $request->get('description');
        $course->course_category_id = $request->get('course_category_id');
        $course->language = $request->get('language');
        $thumbnail = $request->file('imageThumbnail')[0];
        try {
            $path = $course->id . '/';
            $filename = $thumbnail->getClientOriginalName();
            $thumbnail->storeAs($path, $filename , 'thumbnail');
            $course->image_thumbnail = $path . $filename;
            $course->update();
        } catch (\Exception $e) {
            Log::error($e->getMessage());

            return redirect()->back()->withErrors([
                'error' => $e->getMessage()
            ]);
        }

        return redirect()->route('inquiries.index');
    }

}
