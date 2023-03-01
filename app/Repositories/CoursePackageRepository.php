<?php

namespace App\Repositories;

use App\Models\CoursePackage;
use App\Models\CoursePackageCourse;

class CoursePackageRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CoursePackage());
    }

    public function getByUserId($id)
    {
        return $this->model->where('user_id', $id)->get();
    }

    public function addCourseToPackage($coursePackageId, $courseId)
    {
        $package = $this->findOrFail($coursePackageId);

        $alreadyExists = $package->packageItems()->where('course_id', $courseId)->first();

        if ($alreadyExists) {
            return;
        }

        CoursePackageCourse::where('course_id', $courseId)->delete();

        $package->packageItems()->create([
            'course_id' => $courseId
        ]);
    }
}
