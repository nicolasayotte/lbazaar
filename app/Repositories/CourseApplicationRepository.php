<?php

namespace App\Repositories;

use App\Data\CourseApplicationData;
use App\Models\Course;
use App\Models\CourseApplication;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class CourseApplicationRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CourseApplication());
    }

    public function get($filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model
                ->where(function($q) use($filters) {
                    return $q->where('title', 'LIKE', '%'. @$filters['keyword'] .'%')
                            ->orWhereHas('professor', function($q2) use($filters) {
                                return $q2->whereRaw("CONCAT(`first_name`, ' ', `last_name`) LIKE ?", ['%'. @$filters['keyword'] .'%']);
                            });
                })
                ->when(@$filters['course_type'], function($q) use($filters) {
                    return $q->where('course_type_id', @$filters['course_type']);
                })
                ->when(@$filters['category'], function($q) use($filters) {
                    return $q->where('course_category_id', @$filters['category']);
                })
                ->when(@$filters['status'], function($q) use($filters) {
                    // Check if pending
                    if (@$filters['status'] == CourseApplication::PENDING) {
                        return $q->where('approved_at', NULL)
                                ->where('denied_at', NULL);
                    }
                    // Check if approved
                    if (@$filters['status'] == CourseApplication::APPROVED) {
                        return $q->where('approved_at', '!=', NULL);
                    }
                    // Check if denied
                    if (@$filters['status'] == CourseApplication::DENIED) {
                        return $q->where('denied_at', '!=', NULL);
                    }
                })
                ->orderBy($sortBy, $sortOrder)
                ->paginate(CourseApplication::PER_PAGE)
                ->through(function($item) {
                    return CourseApplicationData::fromModel($item);
                });
    }

    public function getMyCourseApplications($filters)
    {
        $sortFilterArr = explode(':', @$filters['sort'] ?? 'created_at:desc');

        $sortBy    = $sortFilterArr[0];
        $sortOrder = $sortFilterArr[1];

        return $this->model->with(['course'])
                ->where(function($q) use($filters) {
                    return $q->where('title', 'LIKE', '%'. @$filters['keyword'] .'%');
                })
                ->when(@$filters['course_type'], function($q) use($filters) {
                    return $q->where('course_type_id', @$filters['course_type']);
                })
                ->when(@$filters['category'], function($q) use($filters) {
                    return $q->where('course_category_id', @$filters['category']);
                })
                ->when(@$filters['status'], function($q) use($filters) {
                    // Check if pending
                    if (@$filters['status'] == CourseApplication::PENDING) {
                        return $q->where('approved_at', NULL)
                                ->where('denied_at', NULL);
                    }
                    // Check if approved
                    if (@$filters['status'] == CourseApplication::APPROVED) {
                        return $q->where('approved_at', '!=', NULL);
                    }
                    // Check if denied
                    if (@$filters['status'] == CourseApplication::DENIED) {
                        return $q->where('denied_at', '!=', NULL);
                    }
                })
                ->where('professor_id', Auth::user()->id)
                ->orderBy($sortBy, $sortOrder)
                ->paginate(CourseApplication::PER_PAGE)
                ->through(function($item) {
                    return CourseApplicationData::fromModel($item);
                });
    }

    public function approve($id)
    {
        $this->model
            ->where('id', $id)
            ->update([
                'approved_at' => Carbon::now(),
                'denied_at'   => null
            ]);
    }

    public function deny($id)
    {
        $this->model
            ->where('id', $id)
            ->update([
                'denied_at'   => Carbon::now(),
                'approved_at' => null
            ]);
    }
}
