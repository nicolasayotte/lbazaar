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

    public function pluckById()
    {
        return $this->model->all()->pluck('name', 'id');
    }

    public function batchUpdate($types)
    {
        foreach ($types as $id => $name) {
            $this->model->where('id', $id)->update(['name' => $name]);
        }
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

    public function getNameById($id)
    {
        return $this->model->find($id)->name;
    }
}
