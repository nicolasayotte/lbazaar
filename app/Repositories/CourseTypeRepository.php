<?php

namespace App\Repositories;

use App\Models\CourseType;
use Carbon\Carbon;

class CourseTypeRepository extends BaseRepository
{
    public function __construct()
    {
        parent::__construct(new CourseType());
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
