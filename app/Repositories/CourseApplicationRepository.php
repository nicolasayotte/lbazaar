<?php

namespace App\Repositories;

use App\Data\CourseApplicationData;
use App\Models\Course;
use App\Models\CourseApplication;
use App\Services\API\EmailService;
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
                ->with(['professor', 'courseType', 'categories', 'course'])
                ->where(function($q) use($filters) {
                    return $q->where('title', 'LIKE', '%'. @$filters['keyword'] .'%')
                            ->orWhereHas('professor', function($q2) use($filters) {
                                return $q2->whereRaw("CONCAT(`first_name`, ' ', `last_name`) LIKE ?", ['%'. @$filters['keyword'] .'%']);
                            });
                })
                ->when(@$filters['course_type'], function($q) use($filters) {
                    return $q->where('course_type_id', @$filters['course_type']);
                })
                ->when($filters['category'], function($q) use($filters) {
                    return $q->whereHas('categories', function($q2) use ($filters) {
                        return $q2->whereIn('id', (array) $filters['category']);
                    });
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

        return $this->model->with(['course', 'categories'])
                ->where(function($q) use($filters) {
                    return $q->where('title', 'LIKE', '%'. @$filters['keyword'] .'%');
                })
                ->when(@$filters['course_type'], function($q) use($filters) {
                    return $q->where('course_type_id', @$filters['course_type']);
                })
                ->when($filters['category'] ?? null, fn($q) =>
                    $q->whereHas('categories', fn($q2) =>
                        $q2->whereIn('id', (array) $filters['category'])
                    )
                )
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
                ->whereDoesntHave('course')
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

    public function findOneApproved($id)
    {
        return $this->model
                    ->with('courseType', 'categories', 'course')
                    ->where('approved_at', '!=', NULL)
                    ->whereDoesntHave('course')
                    ->where('id', $id)
                    ->firstOrFail();
    }

    public function saveWithCategories(array $data, array $categoryIds = [])
    {
        // If $data contains ['id'=>…] you might do update; otherwise create
        $app = isset($data['id'])
            ? $this->model->findOrFail($data['id'])->fill($data)->save() && $this->model->find($data['id'])
            : $this->model->create($data);

        $app->categories()->sync($categoryIds);

        return $app;
    }

    public function processApplication(CourseApplication $applicationData)
    {
        $emailService = new EmailService();

        $applicationData->denied_at = null;
        $applicationData->approved_at = Carbon::now();

        $applicationData->save();

        $emailService->sendEmailCourseApplicationUpdate($applicationData);
    }
}
