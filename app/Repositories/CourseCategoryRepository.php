<?php

namespace App\Repositories;

use App\Models\CourseCategory;

class CourseCategoryRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CourseCategory());
    }

    public function getDropdownData()
    {
        return $this->model->all()->map(function($data) {
            return [
                'id'   => $data->id,
                'name' => $data->name
            ];
        });
    }
}
