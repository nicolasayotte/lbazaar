<?php

namespace App\Repositories;

use App\Data\CourseManageData;
use App\Facades\Asset;
use App\Http\Requests\CourseUpdateRequest;
use App\Models\Course;
use App\Models\CourseCategory;
use Carbon\Carbon;
use DateTime;
use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor', 'courseType', 'categories'])->get();
    }

    public function getUpcomingClasses($take = self::PER_PAGE)
    {
        return $this->model->take($take)->orderBy('id', 'desc')->with(['professor', 'courseType', 'categories', 'coursePackage'])->get();
    }

    public function getLanguages()
    {
        return array_values($this->model->select('language')->distinct()->get()->toArray());
    }

    public function search($request)
    {
        return $this->model->with(['professor', 'schedules', 'categories', 'courseType', 'coursePackage'])
            ->when($request->has('professor_id') && !empty($request->get('professor_id')), function ($q) use ($request)  {
                return $q->where('professor_id', $request->get('professor_id'));
            })
            ->when($request->has('type_id') && !empty($request->get('type_id')), function ($q) use ($request)  {
                return $q->where('course_type_id', $request->get('type_id'));
            })
            ->when($request->filled('category_id'), fn($q) =>
                $q->whereHas('categories', fn($q2) =>
                    $q2->where('id', $request->category_id)
                )
            )
            ->when($request->has('language') && !empty($request->get('language')), function ($q) use ($request)  {
                return $q->where('language', $request->get('language'));
            })
            ->when(@$request['from'], function($q) use($request) {
                return $q->whereHas('schedules', function($query) use($request) {
                    return $query->whereDate('start_datetime', '>=', $request['from']);
                });
            })
            ->when(@$request['to'], function($q) use($request) {
                return $q->whereHas('schedules', function($query) use($request) {
                    return $query->whereDate('start_datetime', '<=', $request['to']);
                });
            })
            ->when($request->has('month') && !empty($request->get('month')), function ($q) use ($request)  {
                return $q->whereHas('schedules', function($query) use ($request) {

                    $startDate = date('Y-m-d', strtotime($request->get('month') . '-01'));
                    $endDate   = date('Y-m-t', strtotime($startDate));

                    return $query->whereBetween('start_datetime', [
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
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'courses.created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];


        return $this->model->select('courses.*')
            ->where(function($q) use($filters) {
                return $q->where('courses.title', 'LIKE', '%'. @$filters['keyword'] .'%');
            })
            ->when(@$filters['course_type'], function($q) use($filters) {
                return $q->where('course_type_id', @$filters['course_type']);
            })
            ->when(!empty($filters['category']), fn($q) =>
                $q->whereHas('categories', fn($q2) =>
                    $q2->where('id', $filters['category'])
                )
            )
            ->when(@$filters['status'], function($q) use($filters) {
                return $q->where('statuses.name', $filters['status']);
            })
            ->when(@$filters['format'], function($q) use($filters) {

                $format = @$filters['format'] == Course::LIVE ? 1 : 0;

                return $q->where('courses.is_live', $format);
            })
            ->where('professor_id', Auth::user()->id)
            ->orderBy($sortBy, $sortOrder)
            ->paginate(self::PER_PAGE)->withQueryString()
            ->through(function($histories) {
                $histories->active_schedules = $this->getActiveSchedules($histories->id);

                return CourseManageData::fromModel($histories);
            });
    }

    public function findById($id)
    {
        return $this->model
                    ->with([
                        'professor',
                        'courseType',
                        'schedules',
                        'categories',
                        'feedbacks',
                        'feedbacks.user',
                        'coursePackage',
                        'coursePackage.courses'
                    ])
                    ->findOrFail($id);
    }

    public function findByIdManageClass($id)
    {
        return $this->model->with(['courseType', 'schedules', 'categories'])->findOrFail($id);
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
        $course = $this->findOrFail($request->id);

        // basic fields
        $course->fill($request->only([
            'title','description','language','is_live',
            'price','points_earned','max_participant',
            'is_cancellable','days_before_cancellation','zoom_link','video_path'
        ]));

        // thumbnail upload
        if ($file = $request->file('imageThumbnail')[0] ?? null) {
            $path     = $course->id . '/';
            $filename = $file->getClientOriginalName();
            $file->storeAs($path, $filename, 'thumbnail');
            $course->image_thumbnail = $path . $filename;
        }

        $course->save();

        // —— new: sync MANY categories ——
        $categoryIds = collect($request->get('categories', []))
            ->map(fn($name) => CourseCategory::firstOrCreate(['name' => $name])->id)
            ->toArray();
        $course->categories()->sync($categoryIds);

        return redirect()->back();
    }

    public function getActiveSchedules($id)
    {
        $course = $this->findOrFail($id);

        $timezone = new DateTimeZone(env('APP_TIMEZONE'));
        $now = Carbon::parse(new DateTime('now', $timezone));

        return $course
                ->schedules()
                ->where('is_completed', 0)
                ->get();
    }

    public function register($courseApplication, $request)
    {
        $inputs = $request->all();

        $inputs['course_category_id'] = CourseCategory::firstOrCreate(['name' => $inputs['category']])->id;
        $isLive = $inputs['format'] == Course::LIVE ? true : false;
        $inputs['course_application_id'] = $courseApplication->id;
        $inputs['professor_id'] = auth()->user()->id;
        $inputs['is_live'] = $isLive;
        if($request->hasFile('image_thumbnail')){
            $inputs['image_thumbnail'] = Asset::upload($request->files->get('image_thumbnail'));
        } else {
            unset($inputs['image_thumbnail']);
        }

        if (!$isLive) {
            $inputs['zoom_link'] = null;
            if($request->hasFile('video_path')){
                $inputs['video_path'] = Asset::upload($request->files->get('video_path'));
            } else {
                unset($inputs['video_path']);
            }
        } else {
            $inputs['video_path'] = null;
            $inputs['video_link'] = null;
        }

        $course = $this->create($inputs);

        return $course;
    }

    public function update($id, Request $request)
    {
        $course = $this->findOrFail($id);

        $inputs = $request->all();
        $inputs['is_live'] = $inputs['format'] === Course::LIVE;

        // files…
        if ($request->hasFile('image_thumbnail')) {
            $inputs['image_thumbnail'] = Asset::upload($request->file('image_thumbnail'));
        }
        if (! $inputs['is_live'] && $request->hasFile('video_path')) {
            $inputs['video_path'] = Asset::upload($request->file('video_path'));
        }

        $course->update(Arr::except($inputs, ['category']));

        // —— new: sync MANY categories ——
        $categoryIds = collect($request->get('categories', []))
            ->map(fn($name) => CourseCategory::firstOrCreate(['name'=>$name])->id)
            ->toArray();
        $course->categories()->sync($categoryIds);

        return $course;
    }
}
